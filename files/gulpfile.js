/*
	Load dependencies
*/
var gulp = require('gulp');
var es = require('event-stream');
var _ = require('underscore');

var $ = require('gulp-load-plugins')();

var stylish = require('jshint-stylish');

var glob = {
	src: {
		scripts: ['public/scripts/**/*.js', 'public/scripts/*.js'],
		styles: 'public/styles/*.less',
		img: ['public/images/*.png', 'public/images/*.jpg', 'public/images/*.gif'],

	},
	dist: {
		scripts: 'public_build/scripts',
		styles: 'public_build/styles',
		img: 'public_build/images'
	},
	bower: {
		scripts: 'public/bower_components/**/*.min.js',
		styles: 'public/bower_components/**/*.css'
	}
};

gulp.task('scripts', function () {

	return gulp.src(glob.src.scripts)
		.pipe($.jshint())
		.pipe($.jshint.reporter(stylish))
		.pipe($.uglify())
		.pipe($.rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest(glob.dist.scripts));
});

gulp.task('bower', function () {
	return gulp.src(glob.bower.scripts)
		.pipe($.flatten())
		.pipe($.concat('vendor.min.js'))
		.pipe(gulp.dest(glob.dist.scripts));
});

gulp.task('styles', function () {
	return gulp.src(glob.src.styles)
		.pipe($.less())
		.pipe($.rename({
			suffix: '.min'
		}))
		.pipe($.cssmin())
		.pipe(gulp.dest(glob.dist.styles));
});

gulp.task('images', function () {
	return gulp.src(glob.src.img)
		.pipe($.imagemin({
			interlaced: true,
			progressive: true,
			optimizationLevel: 7
		}))
		.pipe(gulp.dest(glob.dist.img));
});

gulp.task('compress', function () {
	return es.merge(
		gulp.src(glob.src.scripts)
		.pipe($.gzip({
			append: true
		}))
		.pipe(gulp.dest(glob.dist.scripts)),
		gulp.src(glob.src.styles)
		.pipe($.gzip({
			append: true
		}))
		.pipe(gulp.dest(glob.dist.styles))
	);
});

gulp.task('clean', function () {
	return gulp.src('public_build/**/*', {
			read: false
		})
		.pipe($.clean());
});

gulp.task('build', ['clean-build'], function () {
	gulp.start('compress');
});

gulp.task('clean-build', ['clean'], function () {
	gulp.start('styles', 'scripts', 'bower', 'images');
});