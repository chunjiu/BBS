var gulp = require('gulp');
var less = require('gulp-less');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify-css');
var ejs = require('gulp-ejs');
var smushit = require('gulp-smushit');//雅虎的图片压缩
var imagemin = require('gulp-imagemin');


gulp.task('testLess', function () {
    gulp.src('public/stylesheets/styles.less')
        .pipe(less())
        .pipe(gulp.dest('public/stylesheets'))
});
gulp.task('cssmini', function () { 
    gulp.src(['public/stylesheets*.css', '!public/stylesheets*.min.css'])
        .pipe(minify())
        .pipe(gulp.dest('views/dist/css'));
})
gulp.task('imagemin', function () {
    gulp.src('public/uploads/maintenanceCaseImg/*')
        .pipe(imagemin({
        }))
        .pipe(gulp.dest('public/uploads/maintenanceCaseImg'));
})
gulp.task('smushit', function () { 
    return gulp.src('public/images/*')
        .pipe(smushit({
            verbose:true
        }))
    .pipe(gulp.dest('public/images'))
})
/*gulp.task('rename', function () { 
    gulp.src('views/src/js/document.js')
        .pipe(uglify())
        .pipe(rename('Document.min.js'))
        .pipe(gulp.dest('views/dist/js'));
})*/

