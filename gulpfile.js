const gulp = require("gulp");
const sass = require("gulp-sass");
const uglify = require("gulp-uglify");
const minify = require("gulp-minify");
const sourcemaps = require("gulp-sourcemaps");
const rename = require("gulp-rename");

gulp.task("default", ["build-js", "build-css"], function() {});

gulp.task("build-js", function() {
    return gulp.src(["javascript/*", "javascript/**/*.js", "!javascript/_setup-codebird.example.js"])
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("public/js/"));
});

gulp.task("build-css", function() {
    return gulp.src(["sass/*.scss", "sass/**/*.scss"])
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(minify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("public/css/"));
});

gulp.task("watch", function() {
    gulp.watch(["javascript/*.js", "javascript/**/*.js", "!javascript/_setup-codebird.example.js"], ["build-js"]);
    gulp.watch(["sass/*.scss", "sass/**/*.scss"], ["build-css"]);
});