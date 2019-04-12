const gulp = require('gulp');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const minify = require('gulp-minify');

const dest = 'dist/';
const opts = {
    ext: {
        min: '.min.js'
    }
}

// Builds only the main webshare.js script
gulp.task('build', function () {
    return gulp.src('src/webshare.js')
        .pipe(minify(opts))
        .pipe(gulp.dest(dest));
});

// Builds the entire webshare.js bundle, containing all different platforms
gulp.task('bundle', function () {
    return gulp.src('src/**/*.js')
        .pipe(concat('webshare.bundle.js'))
        .pipe(minify(opts))
        .pipe(gulp.dest(dest));
});

gulp.task('default', gulp.series(['build', 'bundle']), function () { });