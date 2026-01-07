/**
 * Onboarding carousel and timer functionality
 */

// Carousel state
var currentSlide = 0;
var totalSlides = 7;

// Carousel functions
function showSlide(index) {
	// Hide all slides
	var slides = document.querySelectorAll('.slide');
	for (var i = 0; i < slides.length; i++) {
		slides[i].classList.remove('active');
	}

	// Update progress dots
	var dots = document.querySelectorAll('.progress-dot');
	for (var j = 0; j < dots.length; j++) {
		dots[j].classList.remove('active', 'completed');
		if (j < index) {
			dots[j].classList.add('completed');
		} else if (j === index) {
			dots[j].classList.add('active');
		}
	}

	// Show current slide
	var targetSlide = document.querySelector('.slide[data-slide="' + index + '"]');
	if (targetSlide) {
		targetSlide.classList.add('active');
	}
	currentSlide = index;
}

function nextSlide() {
	if (currentSlide < totalSlides - 1) {
		showSlide(currentSlide + 1);
	}
}

function prevSlide() {
	if (currentSlide > 0) {
		showSlide(currentSlide - 1);
	}
}

// Timer functionality
var timeRemaining = 60 * 60; // 60 minutes in seconds

function updateTimer() {
	var timerDisplay = document.getElementById('timerDisplay');
	if (!timerDisplay) return;

	if (timeRemaining <= 0) {
		timerDisplay.textContent = 'Expired';
		return;
	}

	var minutes = Math.floor(timeRemaining / 60);
	var seconds = timeRemaining % 60;
	timerDisplay.textContent =
		(minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

	timeRemaining--;

	// Save state
	localStorage.setItem('mindlessly_premium_timer', timeRemaining);
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
	// Check if timer was already started
	var savedTime = localStorage.getItem('mindlessly_premium_timer');
	var savedTimestamp = localStorage.getItem('mindlessly_premium_timestamp');

	if (savedTime && savedTimestamp) {
		var elapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
		timeRemaining = Math.max(0, parseInt(savedTime) - elapsed);
	} else {
		// Save initial timer state
		localStorage.setItem('mindlessly_premium_timer', timeRemaining);
		localStorage.setItem('mindlessly_premium_timestamp', Date.now().toString());
	}

	// Start timer
	updateTimer();
	setInterval(updateTimer, 1000);

	// Attach click handlers to navigation buttons
	var nextButtons = document.querySelectorAll('.nav-btn-next');
	for (var i = 0; i < nextButtons.length; i++) {
		nextButtons[i].addEventListener('click', function(e) {
			e.preventDefault();
			nextSlide();
		});
	}

	var prevButtons = document.querySelectorAll('.nav-btn-prev');
	for (var j = 0; j < prevButtons.length; j++) {
		prevButtons[j].addEventListener('click', function(e) {
			e.preventDefault();
			prevSlide();
		});
	}

	// Click on progress dots
	var dots = document.querySelectorAll('.progress-dot');
	for (var k = 0; k < dots.length; k++) {
		dots[k].addEventListener('click', function() {
			var slideIndex = parseInt(this.getAttribute('data-slide'));
			showSlide(slideIndex);
		});
	}

	// Keyboard navigation
	document.addEventListener('keydown', function(e) {
		if (e.key === 'ArrowRight') {
			e.preventDefault();
			nextSlide();
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			prevSlide();
		}
	});
});
