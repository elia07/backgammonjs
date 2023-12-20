/*https://gist.github.com/jeromecoupe/0b807b0c1050647eb340360902c3203a*/

function css() {
  return gulp
    .src("./assets/scss/**/*.scss")
    .pipe(plumber())
    .pipe(sass({ outputStyle: "expanded" }))
    .pipe(gulp.dest("./_site/assets/css/"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(gulp.dest("./_site/assets/css/"))
    .pipe(browsersync.stream());
}



exports.default = defaultTask

//var gulp    = require('gulp');

/*gulp.task('copy', function () {
  return gulp.src('./bower_components/jquery/dist/jquery.js')
    .pipe(gulp.dest('./public/js'));
});*/

/*gulp.task('compress', function () {
  return gulp.src(['./public/js/*.js', '!./public/js/all.js'])
    .pipe(uglify())
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./public/js'));
});*/


/*gulp.task('copy', function () {
  return gulp.src('./node_modules/@mdi/font/fonts')
    .pipe(gulp.dest('./public/fonts'));
});*/

/*gulp.task('copy', function () {
  return gulp.src('./node_modules/bootstrap-v4-rtl/css/bootstrap.css')
    .pipe(gulp.dest('./public/css/bootstrap.css'));
});

gulp.task('copy', function () {
  return gulp.src('./node_modules/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.css')
    .pipe(gulp.dest('./public/css/jquery.mCustomScrollbar.css'));
});

gulp.task('copy', function () {
  return gulp.src('./asset/css/style.css')
    .pipe(gulp.dest('./public/css/style.css'));
});

gulp.task('compress', function () {
  return gulp.src(['./public/css/*.css', '!./public/js/allcss.css'])
    .pipe(concat('allcss.js'))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('default', function(callback) {
  runSequence('copy',callback);
});
gulp.task('run', ['copy', 'compress']);*/
