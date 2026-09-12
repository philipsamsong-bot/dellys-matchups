// File: scripts/optimize-media.mjs

import {
    mkdir,
    readFile,
    readdir,
    stat,
    writeFile,
  } from 'node:fs/promises';
  import path from 'node:path';
  import process from 'node:process';
  import sharp from 'sharp';
  
  const projectRoot = process.cwd();
  const publicDirectory = path.join(projectRoot, 'public');
  const reportsDirectory = path.join(projectRoot, 'reports');
  const reportPath = path.join(
    reportsDirectory,
    'media-optimization-report.json',
  );
  
  const sourceImageExtensions = new Set([
    '.png',
    '.jpg',
    '.jpeg',
  ]);
  
  const textFileExtensions = new Set([
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.ts',
    '.tsx',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.html',
    '.json',
    '.md',
    '.mdx',
  ]);
  
  const excludedDirectories = new Set([
    '.git',
    '.next',
    '.vercel',
    'node_modules',
    'coverage',
    'dist',
    'build',
    'reports',
    'scripts',
    'public',
  ]);
  
  const minimumFileSizeBytes = 20 * 1024;
  const maximumImageWidth = 1920;
  const webpQuality = 82;
  const webpAlphaQuality = 100;
  const webpEffort = 6;
  
  function normalizePath(filePath) {
    return filePath.split(path.sep).join('/');
  }
  
  function formatBytes(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
  
    if (bytes < 1024 ** 2) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
  
    return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  }
  
  async function collectFiles(
    directory,
    allowedExtensions,
    excluded = new Set(),
  ) {
    const files = [];
    const entries = await readdir(directory, {
      withFileTypes: true,
    });
  
    for (const entry of entries) {
      if (excluded.has(entry.name)) {
        continue;
      }
  
      const absolutePath = path.join(directory, entry.name);
  
      if (entry.isDirectory()) {
        const nestedFiles = await collectFiles(
          absolutePath,
          allowedExtensions,
          excluded,
        );
  
        files.push(...nestedFiles);
        continue;
      }
  
      if (!entry.isFile()) {
        continue;
      }
  
      const extension = path.extname(entry.name).toLowerCase();
  
      if (allowedExtensions.has(extension)) {
        files.push(absolutePath);
      }
    }
  
    return files;
  }
  
  function createPublicUrl(filePath) {
    const relativePath = path.relative(
      publicDirectory,
      filePath,
    );
  
    return `/${normalizePath(relativePath)}`;
  }
  
  function createOutputPath(sourcePath) {
    const parsedPath = path.parse(sourcePath);
  
    return path.join(
      parsedPath.dir,
      `${parsedPath.name}.webp`,
    );
  }
  
  async function optimizeImage(sourcePath) {
    const sourceStats = await stat(sourcePath);
    const sourceUrl = createPublicUrl(sourcePath);
    const outputPath = createOutputPath(sourcePath);
    const outputUrl = createPublicUrl(outputPath);
  
    if (sourceStats.size < minimumFileSizeBytes) {
      return {
        status: 'skipped',
        sourcePath,
        sourceUrl,
        reason: 'File is already smaller than 20 KB.',
        sourceBytes: sourceStats.size,
      };
    }
  
    const metadata = await sharp(sourcePath).metadata();
  
    if (!metadata.width || !metadata.height) {
      return {
        status: 'skipped',
        sourcePath,
        sourceUrl,
        reason: 'Image dimensions could not be detected.',
        sourceBytes: sourceStats.size,
      };
    }
  
    const targetWidth = Math.min(
      metadata.width,
      maximumImageWidth,
    );
  
    const outputBuffer = await sharp(sourcePath)
      .rotate()
      .resize({
        width: targetWidth,
        withoutEnlargement: true,
      })
      .webp({
        quality: webpQuality,
        alphaQuality: webpAlphaQuality,
        effort: webpEffort,
        smartSubsample: true,
      })
      .toBuffer();
  
    if (outputBuffer.length >= sourceStats.size) {
      return {
        status: 'skipped',
        sourcePath,
        sourceUrl,
        reason: 'Generated WebP was not smaller.',
        sourceBytes: sourceStats.size,
        generatedBytes: outputBuffer.length,
      };
    }
  
    await writeFile(outputPath, outputBuffer);
  
    const savedBytes =
      sourceStats.size - outputBuffer.length;
  
    return {
      status: 'optimized',
      sourcePath,
      outputPath,
      sourceUrl,
      outputUrl,
      sourceWidth: metadata.width,
      sourceHeight: metadata.height,
      outputWidth: targetWidth,
      sourceBytes: sourceStats.size,
      outputBytes: outputBuffer.length,
      savedBytes,
      savedPercentage:
        (savedBytes / sourceStats.size) * 100,
    };
  }
  
  async function updateReferences(filePath, replacements) {
    const originalContent = await readFile(filePath, 'utf8');
    let updatedContent = originalContent;
    const appliedReplacements = [];
  
    for (const replacement of replacements) {
      if (!updatedContent.includes(replacement.sourceUrl)) {
        continue;
      }
  
      updatedContent = updatedContent
        .split(replacement.sourceUrl)
        .join(replacement.outputUrl);
  
      appliedReplacements.push({
        from: replacement.sourceUrl,
        to: replacement.outputUrl,
      });
    }
  
    if (updatedContent === originalContent) {
      return {
        changed: false,
        filePath,
        replacements: [],
      };
    }
  
    await writeFile(filePath, updatedContent, 'utf8');
  
    return {
      changed: true,
      filePath,
      replacements: appliedReplacements,
    };
  }
  
  function makePathRelative(filePath) {
    return normalizePath(
      path.relative(projectRoot, filePath),
    );
  }
  
  async function run() {
    console.log('Scanning public images...\n');
  
    const imageFiles = await collectFiles(
      publicDirectory,
      sourceImageExtensions,
    );
  
    console.log(
      `Found ${imageFiles.length} PNG/JPEG images.\n`,
    );
  
    const imageResults = [];
  
    for (let index = 0; index < imageFiles.length; index += 1) {
      const sourcePath = imageFiles[index];
  
      process.stdout.write(
        `[${index + 1}/${imageFiles.length}] ` +
          `${makePathRelative(sourcePath)}: `,
      );
  
      try {
        const result = await optimizeImage(sourcePath);
        imageResults.push(result);
  
        if (result.status === 'optimized') {
          console.log(
            `${formatBytes(result.sourceBytes)} → ` +
              `${formatBytes(result.outputBytes)} ` +
              `(${result.savedPercentage.toFixed(1)}% saved)`,
          );
        } else {
          console.log(`skipped — ${result.reason}`);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);
  
        imageResults.push({
          status: 'failed',
          sourcePath,
          reason: message,
        });
  
        console.log(`failed — ${message}`);
      }
    }
  
    const optimizedImages = imageResults.filter(
      (result) => result.status === 'optimized',
    );
  
    console.log('\nUpdating project image references...\n');
  
    const textFiles = await collectFiles(
      projectRoot,
      textFileExtensions,
      excludedDirectories,
    );
  
    const referenceResults = [];
  
    for (const textFile of textFiles) {
      try {
        const result = await updateReferences(
          textFile,
          optimizedImages,
        );
  
        referenceResults.push(result);
  
        if (result.changed) {
          console.log(`Updated ${makePathRelative(textFile)}`);
        }
      } catch (error) {
        referenceResults.push({
          changed: false,
          filePath: textFile,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }
  
    const totals = optimizedImages.reduce(
      (summary, image) => {
        summary.sourceBytes += image.sourceBytes;
        summary.outputBytes += image.outputBytes;
        summary.savedBytes += image.savedBytes;
  
        return summary;
      },
      {
        sourceBytes: 0,
        outputBytes: 0,
        savedBytes: 0,
      },
    );
  
    const savedPercentage =
      totals.sourceBytes > 0
        ? (totals.savedBytes / totals.sourceBytes) * 100
        : 0;
  
    const report = {
      generatedAt: new Date().toISOString(),
      configuration: {
        minimumFileSizeBytes,
        maximumImageWidth,
        webpQuality,
        webpAlphaQuality,
        webpEffort,
      },
      summary: {
        discoveredImages: imageFiles.length,
        optimizedImages: optimizedImages.length,
        skippedImages: imageResults.filter(
          (result) => result.status === 'skipped',
        ).length,
        failedImages: imageResults.filter(
          (result) => result.status === 'failed',
        ).length,
        updatedFiles: referenceResults.filter(
          (result) => result.changed,
        ).length,
        originalSize: formatBytes(totals.sourceBytes),
        optimizedSize: formatBytes(totals.outputBytes),
        savedSize: formatBytes(totals.savedBytes),
        savedPercentage: Number(savedPercentage.toFixed(2)),
      },
      images: imageResults.map((result) => ({
        ...result,
        sourcePath: result.sourcePath
          ? makePathRelative(result.sourcePath)
          : undefined,
        outputPath: result.outputPath
          ? makePathRelative(result.outputPath)
          : undefined,
      })),
      referenceUpdates: referenceResults.map((result) => ({
        ...result,
        filePath: makePathRelative(result.filePath),
      })),
    };
  
    await mkdir(reportsDirectory, {
      recursive: true,
    });
  
    await writeFile(
      reportPath,
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8',
    );
  
    console.log('\nOptimization complete');
    console.log('---------------------');
    console.log(
      `Images optimized: ${optimizedImages.length}`,
    );
    console.log(
      `Files updated: ${report.summary.updatedFiles}`,
    );
    console.log(
      `Original size: ${formatBytes(totals.sourceBytes)}`,
    );
    console.log(
      `Optimized size: ${formatBytes(totals.outputBytes)}`,
    );
    console.log(
      `Saved: ${formatBytes(totals.savedBytes)} ` +
        `(${savedPercentage.toFixed(1)}%)`,
    );
    console.log(
      `Report: ${makePathRelative(reportPath)}`,
    );
    console.log('\nNext commands:');
    console.log('npm run build');
    console.log('git status');
    console.log('git diff');
  }
  
  run().catch((error) => {
    console.error(
      `\nOptimization failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  
    process.exitCode = 1;
  });
  