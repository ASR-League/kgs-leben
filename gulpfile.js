﻿"use strict";
var os = require('os');
var fs = require('fs');
var path = require('path');
var isarray = require('isarray');
var glob = require('glob');

// Build Inputs
var inputs = {
    templates: {
        sources: {
            root: 'views',
            html: '**/*.html',
            scss: '**/*.scss',
            scssCatalog: '__views.scss'
        },
    },
    scripts: {
        sources: '**/*.ts',
        project: 'tsconfig.json'
    },
    styles: {
        sources: 'scss/**/*.scss',
        views: 'scss/_views.scss',
        normalize: 'node_modules/normalize.css/normalize.css'
    },
};

// Build Outputs
var outputs = {
    root: "dist",
    templates: 'templates.html',
    scripts: 'js',
    styles: 'css',
    fonts: 'fonts',
    images: 'img'
};

// Static Content
var content = [
    { source: [ '*.html', 'LICENSE' ]},
    { source: 'images/**/*', destination: outputs.images },

    { source: 'node_modules/font-awesome/fonts/*.*', destination: outputs.fonts },
    { source: [ 'node_modules/jquery/dist/jquery.js', 'node_modules/jquery/dist/jquery.min.*' ], destination: outputs.scripts },
    { source: 'wgo.js/*.js', destination: outputs.scripts },
]

// Supported Browsers and Versions
// See CSV data from: gs.statcounter.com
var browsers = [
    'Chrome >= 42',
    'Firefox >= 38',    // Firefox Extended Support Release (ESR) on 2015-12-22
    'Edge >= 12',       // EdgeHTML rendering engine version (not the Edge app. version)
    'Explorer >= 10',
    'iOS >= 8',
    'Safari >= 9',
    'Opera >= 15'
];

// Gulp: The streaming build system
var gulp = require('gulp');
var rimraf = require('rimraf');
var merge = require('merge-stream');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

// Tool-Chain: Scripts
var typescript = require('gulp-typescript');

// Tool-Chain: Styles
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');

// Helper Functions
var multisource = function(p) {
    if ((p) && (isarray(p))) {
        let sources = [];
        for (let j = 0; j < p.length; ++j) {
            sources.push(gulp.src(p[j]));
        }
        return merge(sources);
    }
    else if (p) return gulp.src(p);
    else return null;
}

var multicopy = function(source, destination) {
    destination = (destination)? path.join(outputs.root, destination) : outputs.root;
    return multisource(source).pipe(gulp.dest(destination));
}

// Task(s): Clean
gulp.task('clean:templates', function(callback) {
    rimraf(path.join(outputs.root, outputs.templates), callback);
});
gulp.task('clean:scripts', function(callback) {
    rimraf(path.join(outputs.root, outputs.scripts), callback);
});
gulp.task('clean:styles', function(callback) {
    rimraf(path.join(outputs.root, outputs.styles), () => {
        rimraf(path.join(inputs.templates.sources.root, inputs.templates.sources.scssCatalog), callback);
    });
});
gulp.task('clean:fonts', function(callback) {
    rimraf(path.join(outputs.root, outputs.fonts), callback);
});
gulp.task('clean:images', function(callback) {
    rimraf(path.join(outputs.root, outputs.images), callback);
});

gulp.task('clean', ['clean:styles'], function(callback) {
    rimraf(outputs.root, callback);
});

// Task(s): Build View Templates
gulp.task('build:templates', function() {
    return gulp.src([path.join(inputs.templates.sources.root, inputs.templates.sources.html)])
               .pipe(concat(outputs.templates))
               .pipe(gulp.dest(outputs.root));
});

// Task(s): Build TypeScript Outputs
var tsconfig = typescript.createProject(inputs.scripts.project);
gulp.task('build:scripts', function () {
    let ts = tsconfig.src()
                     .pipe(sourcemaps.init())
                     .pipe(typescript(tsconfig));

    return ts.js.pipe(sourcemaps.write(".")).pipe(gulp.dest(path.join(outputs.root, outputs.scripts)))
});

// Task(s): Build Sass Outputs
gulp.task('build:styles:normalize', function() {
    return gulp.src(inputs.styles.normalize)
               .pipe(gulp.dest(path.join(outputs.root, outputs.styles)));
});
gulp.task('build:styles:views', function(callback) {
    let globOptions = {
        cwd: path.resolve(inputs.templates.sources.root),
        nodir: true,
        nosort: true
    };
    glob(inputs.templates.sources.scss, globOptions, function (error, matches) {
        let fileStreamOptions = {
            flags: 'w',
            defaultEncoding: 'utf8',
            autoClose: true
        };
        let fileStream = fs.createWriteStream(path.join(inputs.templates.sources.root, inputs.templates.sources.scssCatalog), fileStreamOptions);
        let eol = os.EOL;

        fileStream.write("// View SASS Fragments...");
        fileStream.write(eol);
        fileStream.write(eol);

        if (matches) {
            let extensionLength = path.extname(inputs.templates.sources.scss).length;
            for (let j = 0; j < matches.length; ++j) {
                let sassFilename = matches[j];
                if (sassFilename != inputs.templates.sources.scssCatalog) {
                    sassFilename = sassFilename.substring(0, sassFilename.length - extensionLength);

                    fileStream.write("@import \"");
                    fileStream.write(sassFilename);
                    fileStream.write("\";");
                    fileStream.write(eol);
                }
            }
        }

        fileStream.end();
        callback();
    })
});
gulp.task('build:styles', ['build:styles:normalize', 'build:styles:views'], function() {
    return gulp.src(inputs.styles.sources)
               .pipe(sourcemaps.init())
               .pipe(sass({ includePaths: [] }).on('error', sass.logError))
               .pipe(postcss([autoprefixer({ browsers: browsers })]))
               .pipe(sourcemaps.write("."))
               .pipe(gulp.dest(path.join(outputs.root, outputs.styles)));
});

// Task(s): Copy Static Content to Output
gulp.task('build:content', function() {
    let streams = [];
    for (let j = 0; j < content.length; ++j) {
        streams.push(multicopy(content[j].source, content[j].destination));
    }

    return merge(streams);
});

// Task(s): Build et al.
gulp.task('build', ['build:templates', 'build:scripts', 'build:styles', 'build:content']);
gulp.task('default', ['build']);
gulp.task('rebuild', ['clean'], function() { gulp.start('build') });

// Task(s): Incremental Compilation
var watch = function() {
    gulp.watch(path.join(inputs.templates.sources.root, inputs.templates.sources.html), ['build:templates']);

    gulp.watch(inputs.scripts.sources, ['build:scripts']);

    gulp.watch(path.join(inputs.templates.sources.root, inputs.templates.sources.scss), ['build:styles']);
    gulp.watch(inputs.styles.sources, ['build:styles']);

    for (let j = 0; j < content.length; ++j) {
        gulp.watch(content[j].source, multicopy.bind(null, content[j].source, content[j].destination));
    }
};
gulp.task('watch', ['build'], watch);
gulp.task('rewatch', ['rebuild'], watch);
