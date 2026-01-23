#!/usr/bin/env ts-node
/**
 * AST-based Reference Finder for v1 Functions
 *
 * Finds all references to a given function name across the codebase.
 * Categorizes references by type (import, direct-call, method-call, callback)
 * and category (api, service, internal, test, database).
 *
 * Usage:
 *   npx ts-node scripts/find-references.ts <projectRoot> <functionName> <domainName>
 *
 * Example:
 *   npx ts-node scripts/find-references.ts . selectTagListBySearchText tag
 *   npx ts-node scripts/find-references.ts . selectChannelAppList database
 *
 * Output: JSON array of Reference objects
 */

import { Project, SyntaxKind, Node, SourceFile } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

// ===== Types =====

interface Reference {
	file: string;
	line: number;
	type: 'import' | 'direct-call' | 'method-call' | 'callback';
	category: 'api' | 'service' | 'internal' | 'test' | 'database';
	context: string;
}

type ReferenceCategory = Reference['category'];
type ReferenceType = Reference['type'];

// ===== Configuration =====

const CONFIG = {
	// File patterns to include
	include: [
		'src/**/*.ts',
		'src/**/*.tsx',
		'src/**/*.js',
		'src/**/*.jsx',
	],
	// File patterns to exclude
	exclude: [
		'**/node_modules/**',
		'**/dist/**',
		'**/build/**',
		'**/*.d.ts',
	],
	// Context lines before and after the reference
	contextLines: 1,
};

// ===== Category Classification =====

/**
 * Categorize a reference based on its file path
 */
function categorizeReference(filePath: string): ReferenceCategory {
	const normalized = filePath.replace(/\\/g, '/');

	// API: src/pages/api
	if (normalized.includes('src/pages/api')) {
		return 'api';
	}

	// Database: @databases/ imports
	if (normalized.includes('@databases/') || normalized.includes('src/databases/')) {
		return 'database';
	}

	// Test: __tests__, .test., .spec.
	if (
		normalized.includes('__tests__') ||
		normalized.includes('.test.') ||
		normalized.includes('.spec.')
	) {
		return 'test';
	}

	// Service: src/modules/domain (excluding tests)
	if (normalized.includes('src/modules/domain')) {
		return 'service';
	}

	// Internal: everything else
	return 'internal';
}

// ===== Context Extraction =====

/**
 * Extract context lines around the reference
 */
function extractContext(
	sourceFile: SourceFile,
	line: number,
	beforeLines: number = CONFIG.contextLines,
	afterLines: number = CONFIG.contextLines,
): string {
	const text = sourceFile.getFullText();
	const lines = text.split('\n');

	const startLine = Math.max(0, line - 1 - beforeLines);
	const endLine = Math.min(lines.length - 1, line - 1 + afterLines);

	const contextLines = lines.slice(startLine, endLine + 1);

	// Add line numbers
	return contextLines
		.map((l, idx) => {
			const lineNum = startLine + idx + 1;
			const marker = lineNum === line ? '→' : ' ';
			return `${marker} ${lineNum.toString().padStart(4)}: ${l}`;
		})
		.join('\n');
}

// ===== Reference Detection =====

/**
 * Find all references to a function in a source file
 */
function findReferencesInFile(
	sourceFile: SourceFile,
	functionName: string,
	domainName: string,
): Reference[] {
	const references: Reference[] = [];
	const filePath = sourceFile.getFilePath();
	const category = categorizeReference(filePath);

	// Skip files from other domains (if domainName is not 'database')
	if (domainName !== 'database') {
		// If searching in a specific domain, only search domain files and api/test
		if (
			category === 'service' &&
			!filePath.includes(`/domain/${domainName}/`) &&
			!filePath.includes(`/domain_v2/${domainName}/`)
		) {
			return references;
		}
	}

	// 1. Find imports
	sourceFile.getImportDeclarations().forEach((importDecl) => {
		const namedImports = importDecl.getNamedImports();
		namedImports.forEach((namedImport) => {
			if (namedImport.getName() === functionName) {
				const line = namedImport.getStartLineNumber();
				references.push({
					file: filePath,
					line,
					type: 'import',
					category,
					context: extractContext(sourceFile, line),
				});
			}
		});

		// Default import
		const defaultImport = importDecl.getDefaultImport();
		if (defaultImport && defaultImport.getText() === functionName) {
			const line = defaultImport.getStartLineNumber();
			references.push({
				file: filePath,
				line,
				type: 'import',
				category,
				context: extractContext(sourceFile, line),
			});
		}
	});

	// 2. Find call expressions (direct calls)
	sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpr) => {
		const expression = callExpr.getExpression();

		// Direct call: functionName()
		if (Node.isIdentifier(expression) && expression.getText() === functionName) {
			const line = callExpr.getStartLineNumber();
			references.push({
				file: filePath,
				line,
				type: 'direct-call',
				category,
				context: extractContext(sourceFile, line),
			});
		}

		// Method call: object.functionName()
		if (Node.isPropertyAccessExpression(expression)) {
			const propertyName = expression.getName();
			if (propertyName === functionName) {
				const line = callExpr.getStartLineNumber();
				references.push({
					file: filePath,
					line,
					type: 'method-call',
					category,
					context: extractContext(sourceFile, line),
				});
			}
		}
	});

	// 3. Find property access expressions (callbacks, assignments)
	sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach((propAccess) => {
		const propertyName = propAccess.getName();

		if (propertyName === functionName) {
			// Check if already counted as method-call
			const parent = propAccess.getParent();
			if (!Node.isCallExpression(parent)) {
				const line = propAccess.getStartLineNumber();
				references.push({
					file: filePath,
					line,
					type: 'callback',
					category,
					context: extractContext(sourceFile, line),
				});
			}
		}
	});

	// 4. Find identifier references (callbacks, assignments)
	sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).forEach((identifier) => {
		if (identifier.getText() === functionName) {
			// Check if already counted
			const parent = identifier.getParent();

			// Skip if it's a function declaration
			if (
				Node.isFunctionDeclaration(parent) ||
				Node.isMethodDeclaration(parent) ||
				Node.isVariableDeclaration(parent)
			) {
				return;
			}

			// Skip if it's part of an import
			if (
				Node.isImportSpecifier(parent) ||
				Node.isImportClause(parent) ||
				Node.isImportDeclaration(parent)
			) {
				return;
			}

			// Skip if it's already counted as direct-call or method-call
			if (Node.isCallExpression(parent)) {
				return;
			}

			// Skip if it's property access (already counted)
			if (Node.isPropertyAccessExpression(parent)) {
				return;
			}

			const line = identifier.getStartLineNumber();

			// Check if this line already has a reference
			const alreadyExists = references.some((ref) => ref.line === line && ref.file === filePath);

			if (!alreadyExists) {
				references.push({
					file: filePath,
					line,
					type: 'callback',
					category,
					context: extractContext(sourceFile, line),
				});
			}
		}
	});

	return references;
}

// ===== Main =====

async function main() {
	// Parse arguments
	const args = process.argv.slice(2);
	if (args.length < 3) {
		console.error('Usage: npx ts-node scripts/find-references.ts <projectRoot> <functionName> <domainName>');
		console.error('Example: npx ts-node scripts/find-references.ts . selectTagListBySearchText tag');
		console.error('Example: npx ts-node scripts/find-references.ts . selectChannelAppList database');
		process.exit(1);
	}

	const [projectRoot, functionName, domainName] = args;

	// Validate projectRoot
	const resolvedRoot = path.resolve(projectRoot);
	if (!fs.existsSync(resolvedRoot)) {
		console.error(`Error: Project root not found: ${resolvedRoot}`);
		process.exit(1);
	}

	console.error(`[find-references] Searching for '${functionName}' in domain '${domainName}'...`);
	console.error(`[find-references] Project root: ${resolvedRoot}`);

	// Initialize ts-morph project
	const project = new Project({
		tsConfigFilePath: path.join(resolvedRoot, 'tsconfig.json'),
		skipAddingFilesFromTsConfig: false,
	});

	// Get all source files
	const sourceFiles = project.getSourceFiles();
	console.error(`[find-references] Found ${sourceFiles.length} source files`);

	// Find references
	const allReferences: Reference[] = [];

	for (const sourceFile of sourceFiles) {
		const filePath = sourceFile.getFilePath();

		// Apply exclude filters
		const shouldExclude = CONFIG.exclude.some((pattern) => {
			const regex = new RegExp(pattern.replace(/\*/g, '.*'));
			return regex.test(filePath);
		});

		if (shouldExclude) {
			continue;
		}

		const refs = findReferencesInFile(sourceFile, functionName, domainName);
		allReferences.push(...refs);
	}

	// Sort by file, then line
	allReferences.sort((a, b) => {
		if (a.file !== b.file) {
			return a.file.localeCompare(b.file);
		}
		return a.line - b.line;
	});

	// Print summary to stderr
	console.error(`[find-references] Found ${allReferences.length} references`);

	const byType: Record<ReferenceType, number> = {
		import: 0,
		'direct-call': 0,
		'method-call': 0,
		callback: 0,
	};

	const byCategory: Record<ReferenceCategory, number> = {
		api: 0,
		service: 0,
		internal: 0,
		test: 0,
		database: 0,
	};

	allReferences.forEach((ref) => {
		byType[ref.type]++;
		byCategory[ref.category]++;
	});

	console.error('[find-references] By type:', byType);
	console.error('[find-references] By category:', byCategory);

	// Output JSON to stdout
	console.log(JSON.stringify(allReferences, null, 2));
}

// Run
main().catch((error) => {
	console.error('[find-references] Error:', error);
	process.exit(1);
});
