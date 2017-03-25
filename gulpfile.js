const gulp = require("gulp");
const sass = require("gulp-sass");
const uglify = require("gulp-uglify");
const minify = require("gulp-minify");
const sourcemaps = require("gulp-sourcemaps");
const rename = require("gulp-rename");

gulp.task("default", ["build-js"], function() {});

gulp.task("build-js", function() {
    return gulp.src(["javascript/*", "javascript/**/*.js"])
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("public/js/"));
});

gulp.task("watch", function() {
    gulp.watch(["javascript/*.js", "javascript/**/*.js"], ["build-js"]);
});