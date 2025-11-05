/**
 * @file Content script for Mindlessly that creates the mindful browsing interface
 * with purpose prompts and smart timer functionality for focused sessions.
 */

const placeholder = "What's your purpose here?"
const extensionID = chrome.runtime.id

// Inline feedback utility functions
const trackSessionCompletion = function() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(['usageStats'], (data) => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError)
			}

			const stats = data.usageStats || {
				sessionsCompleted: 0,
				feedbackRequested: false,
				feedbackGiven: false,
				npsScore: null,
				lastFeedbackRequest: null,
				installDate: Date.now()
			}

			stats.sessionsCompleted += 1
			stats.lastSessionDate = Date.now()

			chrome.storage.local.set({ usageStats: stats }, () => {
				if (chrome.runtime.lastError) {
					return reject(chrome.runtime.lastError)
				}
				resolve(stats)
			})
		})
	})
}

const shouldRequestFeedback = function() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(['usageStats'], (data) => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError)
			}

			const stats = data.usageStats || {
				sessionsCompleted: 0,
				feedbackRequested: false,
				feedbackGiven: false
			}

			const shouldRequest = (
				stats.sessionsCompleted >= 3 && 
				!stats.feedbackGiven && 
				(!stats.feedbackRequested || stats.sessionsCompleted >= 6)
			)

			resolve({
				shouldRequest,
				sessionCount: stats.sessionsCompleted,
				stats
			})
		})
	})
}

const markFeedbackRequested = function() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(['usageStats'], (data) => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError)
			}

			const stats = data.usageStats || {}
			stats.feedbackRequested = true
			stats.lastFeedbackRequest = Date.now()

			chrome.storage.local.set({ usageStats: stats }, () => {
				if (chrome.runtime.lastError) {
					return reject(chrome.runtime.lastError)
				}
				resolve(stats)
			})
		})
	})
}

const saveNPSScore = function(score, category) {
	return new Promise((resolve, reject) => {
		if (score < 0 || score > 10) {
			return reject(new Error('NPS score must be between 0 and 10'))
		}

		chrome.storage.local.get(['usageStats'], (data) => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError)
			}

			const stats = data.usageStats || {}
			stats.npsScore = score
			stats.npsCategory = category
			stats.feedbackGiven = true
			stats.npsSubmissionDate = Date.now()

			chrome.storage.local.set({ usageStats: stats }, () => {
				if (chrome.runtime.lastError) {
					return reject(chrome.runtime.lastError)
				}
				resolve(stats)
			})
		})
	})
}

const getNPSCategory = function(score) {
	if (score <= 6) return 'detractor'
	if (score <= 8) return 'passive'
	return 'promoter'
}

const template = document.createElement('template')

template.innerHTML = /*html*/ `
	<style>
		@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
		
		/* Use Bierstadt-like font (Inter as fallback) */
		* {
			font-family: 'Bierstadt', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		}
		
		/* Blurs the page */
		#veil {
			position: fixed !important;
			top: 0 !important;
			left: 0 !important;
			z-index: 999999 !important;
			display: block !important;
			width: 100% !important;
			height: 100% !important;
			background-color: rgba(0, 0, 0, 0.4) !important;
			visibility: hidden !important;
			opacity: 0 !important;
			backdrop-filter: blur(16px) !important;
			pointer-events: none !important;
		}

		#veil.isVisible {
			visibility: visible !important;
			opacity: 1 !important;
			pointer-events: all !important;
		}

		/* 
		* Intention box
		*/
		.container {
			/* We don't have access to vars.css */
			--font-size: 16px;
			--spacing: 16px;
			--color-accent: #000;
			--color-highlight: #3a3b3c;

			position: fixed !important;
			top: 32px !important;
			left: 50% !important;
			z-index: 9999999 !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
			min-width: 128px !important;
			padding: 8px 42px 8px 16px !important;
			color: #000 !important;
			font-size: var(--font-size) !important;
			background: #fff !important;
			border-radius: 96px !important;
			box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px !important;
			transform: translateX(-50%) !important;
			cursor: grab !important;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
		}

		.container.has-timer {
			padding: 8px 50px 8px 16px;
		}

		.clock-icon {
			position: absolute;
			top: 50%;
			right: 18px;
			width: 16px;
			height: 16px;
			transform: translateY(-50%);
		}

		.clock-icon::before {
			content: '';
			position: absolute;
			width: 16px;
			height: 16px;
			border: 2px solid #666;
			border-radius: 50%;
			background: #fff;
		}

		.clock-icon::after {
			content: '';
			position: absolute;
			top: 3px;
			left: 50%;
			width: 2px;
			height: 5px;
			background: #666;
			border-radius: 1px;
			transform: translateX(-50%);
			transform-origin: bottom center;
		}

		/* 
		* Intention input
		*/
		#input {
			position: relative;
			min-width: 128px;
			padding: 6px;
			border-radius: 96px;
			cursor: text !important;
		}

		#input:focus {
			border: none;
			outline: none;
		}

		#input:empty::before {
			color: #717171;
			font-style: normal;
			content: "${placeholder}";
		}

		#input:not(:focus):hover {
			background: rgba(0, 0, 0, 0.025);
		}

		#input:focus::after {
			position: absolute;
			top: 0;
			left: 100%;
			display: flex;
			align-items: center;
			height: 100%;
			padding: 0px 32px;
			color: lightgray;
			white-space: nowrap;
			opacity: 1;
			content: '↵ Enter';
			pointer-events: none;
			transition: opacity .3s;
		}

		#input:empty::after {
			opacity: 0 !important;
		}

		#input:empty::after {
			pointer-events: all;
		}

		.container:hover #input::after {
			opacity: 1;
		}

		/* 
		* Timer Selection UI
		*/
		.timer-selection {
			position: fixed !important;
			top: 120px !important;
			left: 50% !important;
			z-index: 9999998 !important;
			display: none !important;
			flex-direction: column !important;
			gap: 12px !important;
			padding: 20px !important;
			background: #fff !important;
			border-radius: 16px !important;
			box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px !important;
			transform: translateX(-50%) !important;
			min-width: 280px !important;
			color: #000 !important;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
		}

		.timer-selection h3 {
			color: #000 !important;
			font-weight: 600;
		}

		.timer-selection.visible {
			display: flex !important;
		}
		
		.timer-selection.compact {
			padding: 10px 20px;
			min-width: auto;
			top: 80px;
		}

		.timer-options {
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
		}

		.timer-btn {
			padding: 8px 16px;
			border: 2px solid #e0e0e0;
			border-radius: 8px;
			background: #fff !important;
			cursor: pointer;
			font-size: 14px;
			font-weight: 500;
			transition: all 0.2s;
			opacity: 1 !important;
			visibility: visible !important;
			display: inline-block !important;
			color: #000;
		}

		.timer-btn:hover {
			border-color: var(--color-accent) !important;
			background: #f5f5f5 !important;
			opacity: 1 !important;
			visibility: visible !important;
		}

		.timer-btn:active,
		.timer-btn:focus {
			opacity: 1 !important;
			visibility: visible !important;
			outline: none;
		}

		.timer-btn.selected {
			border: 4px solid var(--color-accent) !important;
			background: #fff !important;
			color: var(--color-accent) !important;
			opacity: 1 !important;
			visibility: visible !important;
			display: inline-block !important;
			font-weight: 700;
			box-shadow: 0 0 0 1px var(--color-accent) !important;
		}

		.timer-btn.selected:hover {
			background: #f8f8f8 !important;
			border: 4px solid var(--color-accent) !important;
			color: var(--color-accent) !important;
			opacity: 1 !important;
			visibility: visible !important;
			display: inline-block !important;
		}

		.timer-btn.inverted {
			background: #000 !important;
			color: white !important;
			border: 3px solid #000 !important;
			font-weight: 600;
		}

		.timer-btn.inverted:hover {
			background: #333 !important;
			border-color: #333 !important;
		}

		.custom-timer {
			display: none;
			align-items: center;
			gap: 8px;
			margin-top: 8px;
		}

		.custom-timer.visible {
			display: flex;
		}

		.custom-timer input {
			width: 60px;
			padding: 6px 8px;
			border: 2px solid #e0e0e0;
			border-radius: 6px;
			text-align: center;
			color: #000 !important;
			background: #fff;
			font-weight: 500;
		}

		.custom-timer input:focus {
			border-color: var(--color-accent);
			outline: none;
			color: #000 !important;
		}

		.custom-timer span {
			color: #000;
			font-weight: 500;
		}

		.start-timer-btn {
			padding: 10px 20px;
			background: #000;
			color: white;
			border: 2px solid #000;
			border-radius: 8px;
			cursor: pointer;
			font-size: 14px;
			font-weight: 500;
			margin-top: 12px;
			transition: all 0.2s;
		}

		.start-timer-btn:hover {
			background: #333;
			border-color: #333;
		}

		.start-timer-btn:disabled {
			background: #f5f5f5;
			color: #999;
			border-color: #ddd;
			cursor: not-allowed;
		}

		/* 
		* Timer Circle Progress
		*/
		.timer-circle {
			position: absolute;
			top: 50%;
			right: 16px;
			width: 24px;
			height: 24px;
			transform: translateY(-50%);
		}

		.timer-circle svg {
			width: 100%;
			height: 100%;
			transform: rotate(-90deg);
		}

		.timer-circle .circle-bg {
			fill: none;
			stroke: #e0e0e0;
			stroke-width: 2;
		}

		.timer-circle .circle-progress {
			fill: none;
			stroke: var(--color-accent);
			stroke-width: 2;
			stroke-linecap: round;
			transition: stroke-dashoffset 1s linear;
		}

		.timer-text {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			font-size: 8px;
			font-weight: bold;
			color: var(--color-accent);
		}

		/* 
		* Timer Complete Dialog
		*/
		.timer-complete-dialog {
			position: fixed !important;
			top: 50% !important;
			left: 50% !important;
			z-index: 9999997 !important;
			display: none !important;
			flex-direction: column !important;
			gap: 20px !important;
			padding: 32px !important;
			background: #fff !important;
			border-radius: 16px !important;
			box-shadow: rgba(100, 100, 111, 0.3) 0px 7px 29px 0px !important;
			transform: translate(-50%, -50%) !important;
			min-width: 400px !important;
			max-width: 480px !important;
			text-align: center !important;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
		}

		/* 
		* Feedback Dialog
		*/
		.feedback-dialog {
			position: fixed !important;
			top: 50% !important;
			left: 50% !important;
			z-index: 9999996 !important;
			display: none !important;
			flex-direction: column !important;
			gap: 24px !important;
			padding: 40px !important;
			background: #fff !important;
			border-radius: 20px !important;
			box-shadow: rgba(100, 100, 111, 0.3) 0px 7px 29px 0px !important;
			transform: translate(-50%, -50%) !important;
			min-width: 460px !important;
			max-width: 520px !important;
			text-align: center !important;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
		}

		.feedback-dialog.visible {
			display: flex !important;
		}

		.feedback-dialog h3 {
			font-size: 28px !important;
			font-weight: 700 !important;
			color: #000 !important;
			margin: 0 0 8px 0 !important;
			line-height: 1.2 !important;
		}

		.feedback-dialog .subtitle {
			font-size: 18px !important;
			font-weight: 500 !important;
			color: #666 !important;
			margin: 0 0 24px 0 !important;
			line-height: 1.4 !important;
		}

		.nps-question {
			font-size: 20px !important;
			font-weight: 600 !important;
			color: #333 !important;
			margin: 0 0 20px 0 !important;
		}

		.nps-scale {
			display: flex !important;
			justify-content: space-between !important;
			gap: 8px !important;
			margin-bottom: 16px !important;
		}

		.nps-button {
			width: 40px !important;
			height: 40px !important;
			border: 2px solid #e0e0e0 !important;
			border-radius: 8px !important;
			background: #fff !important;
			cursor: pointer !important;
			font-size: 16px !important;
			font-weight: 600 !important;
			transition: all 0.2s ease !important;
			color: #333 !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
		}

		.nps-button:hover {
			border-color: #000 !important;
			background: #f8f8f8 !important;
		}

		.nps-button.selected {
			border-color: #000 !important;
			background: #000 !important;
			color: #fff !important;
		}

		.nps-labels {
			display: flex !important;
			justify-content: space-between !important;
			font-size: 12px !important;
			color: #666 !important;
			margin-bottom: 24px !important;
		}

		.feedback-actions {
			display: flex !important;
			gap: 16px !important;
			justify-content: center !important;
			flex-wrap: wrap !important;
		}

		.feedback-btn {
			padding: 12px 24px !important;
			border: 2px solid #000 !important;
			border-radius: 8px !important;
			cursor: pointer !important;
			font-size: 16px !important;
			font-weight: 600 !important;
			transition: all 0.2s ease !important;
			text-decoration: none !important;
			display: inline-flex !important;
			align-items: center !important;
			justify-content: center !important;
			min-width: 120px !important;
		}

		.feedback-btn.primary {
			background: #000 !important;
			color: #fff !important;
		}

		.feedback-btn.primary:hover {
			background: #333 !important;
		}

		.feedback-btn.secondary {
			background: #fff !important;
			color: #000 !important;
		}

		.feedback-btn.secondary:hover {
			background: #f8f8f8 !important;
		}

		.feedback-btn:disabled {
			background: #f5f5f5 !important;
			color: #999 !important;
			border-color: #ddd !important;
			cursor: not-allowed !important;
		}

		.feedback-thank-you {
			display: none !important;
		}

		.feedback-thank-you.visible {
			display: block !important;
		}

		.feedback-thank-you h4 {
			font-size: 24px !important;
			font-weight: 700 !important;
			color: #000 !important;
			margin: 0 0 12px 0 !important;
		}

		.feedback-thank-you p {
			font-size: 16px !important;
			color: #666 !important;
			margin: 0 0 20px 0 !important;
		}

		.timer-complete-dialog h3 {
			font-size: 26px !important;
			font-weight: 700 !important;
			color: #000 !important;
			margin: 0 !important;
		}

		.timer-complete-dialog p {
			font-size: 22px !important;
			font-weight: 500 !important;
			color: #444 !important;
			margin: 12px 0 !important;
			line-height: 1.4 !important;
		}

		.timer-complete-dialog.visible {
			display: flex !important;
		}

		.dialog-buttons {
			display: flex;
			gap: 24px;
			justify-content: space-between;
			align-items: center;
			width: 100%;
			margin-top: 16px;
		}

		.dialog-btn {
			padding: 18px 28px;
			border: 2px solid var(--color-accent);
			border-radius: 8px;
			cursor: pointer;
			font-size: 18px !important;
			font-weight: 600;
			transition: all 0.2s ease, border-width 0.15s ease, transform 0.1s ease;
			opacity: 1 !important;
			visibility: visible !important;
			display: inline-block !important;
			text-align: center;
			white-space: nowrap;
			width: auto;
			min-width: 140px;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
		}

		.dialog-btn.primary {
			background: var(--color-accent) !important;
			color: white !important;
			border-color: var(--color-accent) !important;
			font-weight: 700 !important;
			opacity: 1 !important;
			visibility: visible !important;
			display: inline-block !important;
		}

		.dialog-btn.secondary {
			background: white !important;
			color: var(--color-accent) !important;
			border-color: var(--color-accent) !important;
			border-width: 2px !important;
			font-weight: 600 !important;
			opacity: 1 !important;
			visibility: visible !important;
			display: inline-block !important;
		}
		
		/* DEBUG: Force both buttons to be visible */
		#extendBtn {
			background: white !important;
			color: var(--color-accent) !important;
			border: 2px solid var(--color-accent) !important;
			display: inline-block !important;
			opacity: 1 !important;
			visibility: visible !important;
			position: static !important;
			transition: all 0.2s ease, border-width 0.15s ease, transform 0.1s ease !important;
		}
		
		#extendBtn:hover {
			border-color: #000 !important;
			border-width: 3px !important;
			background: #f8f8f8 !important;
		}
		
		#extendBtn:active,
		#extendBtn:focus {
			border: 4px solid #000 !important;
			background: #f0f0f0 !important;
		}
		
		#newTaskBtn {
			background: white !important;
			color: var(--color-accent) !important;
			border: 2px solid var(--color-accent) !important;
			display: inline-block !important;
			opacity: 1 !important;
			visibility: visible !important;
			position: static !important;
			transition: all 0.2s ease, border-width 0.15s ease, transform 0.1s ease !important;
		}
		
		#newTaskBtn:hover {
			border-color: #000 !important;
			border-width: 3px !important;
			background: #f8f8f8 !important;
		}
		
		#newTaskBtn:active,
		#newTaskBtn:focus {
			border: 4px solid #000 !important;
			background: #f0f0f0 !important;
		}

		.dialog-btn:hover {
			border-color: #000 !important;
			border-width: 3px !important;
			opacity: 1 !important;
			visibility: visible !important;
			display: inline-block !important;
			transform: translateY(-1px);
			transition: all 0.2s ease;
		}
		
		.dialog-btn:active,
		.dialog-btn:focus {
			border: 4px solid #000 !important;
			opacity: 1 !important;
			visibility: visible !important;
			display: inline-block !important;
			transform: translateY(0px);
			transition: all 0.1s ease;
		}

		/* 
		* On drag
		*/
		.container.is-about-to-drag {
			cursor: grabbing !important;
		}

		.container.is-dragging #input {
			cursor: grabbing !important;
		}

		.container.is-dragging #input:hover {
			background: none;
		}
	</style>
	<div id="veil"></div>
	<div class="container" id="container">
		<div id="input"></div>
		<span class="clock-icon" id="clockIcon"></span>
		<div class="timer-circle" id="timerCircle" style="display: none;">
			<svg viewBox="0 0 24 24">
				<circle class="circle-bg" cx="12" cy="12" r="10"></circle>
				<circle class="circle-progress" cx="12" cy="12" r="10" 
					stroke-dasharray="62.83" stroke-dashoffset="62.83"></circle>
			</svg>
			<div class="timer-text" id="timerText">5</div>
		</div>
	</div>
	<div class="timer-selection" id="timerSelection">
		<h3 style="margin: 0; font-size: 16px;">Choose timer duration:</h3>
		<div class="timer-options">
			<div class="timer-btn" data-minutes="no-timer">No timer</div>
			<div class="timer-btn" data-minutes="1">1 min</div>
			<div class="timer-btn" data-minutes="10">10 min</div>
			<div class="timer-btn" data-minutes="custom">Custom</div>
		</div>
		<div class="custom-timer" id="customTimer">
			<input type="number" id="customMinutes" min="1" max="120" value="5" />
			<span>minutes</span>
		</div>
		<button class="start-timer-btn" id="startTimer" disabled>Start Timer</button>
	</div>
	<div class="timer-complete-dialog" id="timerCompleteDialog">
		<h3 style="margin: 0;">Time's up!</h3>
		<p style="margin: 8px 0;">What would you like to do?</p>
		<div class="dialog-buttons">
			<button class="dialog-btn secondary" id="extendBtn">Add 5 more min</button>
			<button class="dialog-btn primary" id="newTaskBtn">Start a new task</button>
		</div>
	</div>
	<div class="feedback-dialog" id="feedbackDialog">
		<div class="feedback-content" id="feedbackContent">
			<h3>🎉 You're on a roll!</h3>
			<p class="subtitle">You've completed 3 focused sessions with Mindlessly. Your opinion matters to us!</p>
			
			<div class="nps-question">How likely are you to recommend Mindlessly to a friend?</div>
			
			<div class="nps-scale" id="npsScale">
				<button class="nps-button" data-score="0">0</button>
				<button class="nps-button" data-score="1">1</button>
				<button class="nps-button" data-score="2">2</button>
				<button class="nps-button" data-score="3">3</button>
				<button class="nps-button" data-score="4">4</button>
				<button class="nps-button" data-score="5">5</button>
				<button class="nps-button" data-score="6">6</button>
				<button class="nps-button" data-score="7">7</button>
				<button class="nps-button" data-score="8">8</button>
				<button class="nps-button" data-score="9">9</button>
				<button class="nps-button" data-score="10">10</button>
			</div>
			
			<div class="nps-labels">
				<span>Not likely</span>
				<span>Extremely likely</span>
			</div>
			
			<div class="feedback-actions">
				<button class="feedback-btn secondary" id="feedbackSkip">Maybe later</button>
				<button class="feedback-btn primary" id="feedbackSubmit" disabled>Continue</button>
			</div>
		</div>
		
		<div class="feedback-thank-you" id="feedbackThankYou">
			<h4>Thank you! 🙏</h4>
			<p>Your feedback helps us make Mindlessly better for everyone.</p>
			<div class="feedback-actions">
				<a class="feedback-btn secondary" id="feedbackDetailed" href="" target="_blank">Share more thoughts</a>
				<button class="feedback-btn secondary" id="feedbackContact">Get support</button>
				<button class="feedback-btn primary" id="feedbackClose">Continue browsing</button>
			</div>
		</div>
	</div>
`

/**
 * Custom element that encapsulates the injected container and
 * avoids conflicts with incoming or outgoing styles etc.
 */
class Intention extends HTMLElement {
	constructor() {
		super()

		let rec, initX, initY, isDragging
		let draggable = true
		let vector = { x: -1, y: -1 }
		
		// Timer properties as instance variables
		this.timerInterval = null
		this.currentTimer = null
		this.timerCompleted = false // Track if timer completion dialog has been shown

		const drag_treshold = 6 // px
		const shadowRoot = this.attachShadow({ mode: 'open' })
		shadowRoot.appendChild(template.content.cloneNode(true))

		this.veil = this.shadowRoot.getElementById('veil')
		this.input = this.shadowRoot.getElementById('input')
		this.container = this.shadowRoot.getElementById('container')
		this.timerSelection = this.shadowRoot.getElementById('timerSelection')
		this.timerCircle = this.shadowRoot.getElementById('timerCircle')
		this.timerText = this.shadowRoot.getElementById('timerText')
		this.timerCompleteDialog = this.shadowRoot.getElementById('timerCompleteDialog')
		this.feedbackDialog = this.shadowRoot.getElementById('feedbackDialog')
		this.feedbackContent = this.shadowRoot.getElementById('feedbackContent')
		this.feedbackThankYou = this.shadowRoot.getElementById('feedbackThankYou')

		// Focus persistence only for initial LinkedIn loading
		this.focusProtection = null

		/**
		 * Handle input events
		 */
		this.input.addEventListener('focus', (e) => {
			document.body.classList.add('intent-focus')
			this.veil.classList.add('isVisible')
			this.container.classList.add('is-editing')
			draggable = false
			
			// Only protect focus on LinkedIn during initial empty state
			if (window.location.hostname.includes('linkedin.com') && !this.input.innerHTML) {
				this.startLinkedInFocusProtection()
			}
		})

		this.input.addEventListener('blur', (e) => {
			// Don't process blur if it's due to focus protection
			if (this.focusBeingRestored) {
				this.focusBeingRestored = false
				return
			}

			// trap focus if no intention has been set
			if (!this.input.innerHTML) {
				this.input.focus()
			} else {
				// Stop any focus protection
				this.stopFocusProtection()
				
				sessionStorage.setItem(
					`${extensionID}-intention`,
					e.target.innerHTML
				)
				this.veil.classList.remove('isVisible')
				this.container.classList.remove('is-editing')
				document.body.classList.remove('intent-focus')
				this.input.contentEditable = 'false'
				draggable = true
				
				// Clear any existing timer when setting new intention
				if (this.timerInterval) {
					clearInterval(this.timerInterval)
					this.timerInterval = null
				}
				this.currentTimer = null
				sessionStorage.removeItem(`${extensionID}-timer`)
				this.hideTimerCircle()
				
				// Show timer selection after setting intention
				this.showTimerSelection()
			}
		})

		this.input.addEventListener('keydown', (e) => {
			// some websites (ex. youtube) prevent whitespaces hence we insert them programmatically, TODO: figure out why
			if (e.key === ' ' || e.key === 'Spacebar') {
				e.preventDefault()
				this.insertAtCursor('&nbsp;')
			} else if (e.key === 'Enter') {
				e.preventDefault()
				// Stop focus protection to allow normal flow
				this.stopFocusProtection()
				this.input.blur()
			}
		})

		/**
		 * Minimal focus protection only for LinkedIn's initial loading phase
		 */
		this.startLinkedInFocusProtection = () => {
			// Very targeted protection: only during first 3 seconds of LinkedIn loading
			let attempts = 0
			const maxAttempts = 10 // 10 attempts over 3 seconds
			
			this.focusProtection = setInterval(() => {
				attempts++
				
				// Stop after 3 seconds regardless
				if (attempts >= maxAttempts) {
					this.stopFocusProtection()
					return
				}
				
				// Only restore focus if it was stolen and input is still empty
				if (document.activeElement !== this.input && 
					this.input.contentEditable === 'true' && 
					!this.input.innerHTML) {
					this.focusBeingRestored = true
					this.input.focus()
				} else if (this.input.innerHTML) {
					// Stop protection once user starts typing
					this.stopFocusProtection()
				}
			}, 300)
		}

		this.stopFocusProtection = () => {
			if (this.focusProtection) {
				clearInterval(this.focusProtection)
				this.focusProtection = null
			}
		}

		/**
		 * Handle timer selection events
		 */
		this.setupTimerEvents()

		/**
		 * Handle feedback events
		 */
		this.setupFeedbackEvents()

		/**
		 * Handle drag events
		 */
		this.container.addEventListener('mousedown', (e) => {
			rec = this.container.getBoundingClientRect()
			initX = e.clientX
			initY = e.clientY
			isDragging = true
			this.container.classList.add('is-about-to-drag')
		})

		document.addEventListener('mousemove', (e) => {
			if (draggable && isDragging) {
				e.preventDefault()

				const deltaX = Math.abs(e.clientX - initX)
				const deltaY = Math.abs(e.clientY - initY)
				if (deltaX > drag_treshold || deltaY > drag_treshold) {
					this.container.classList.add('is-dragging')
				}

				const absoluteX = Math.min(
					Math.max(rec.left + e.clientX - initX, 0),
					window.innerWidth - rec.width
				)
				const absoluteY = Math.min(
					Math.max(rec.top + e.clientY - initY, 0),
					window.innerHeight - rec.height
				)
				const relativeX = (100 * absoluteX) / window.innerWidth //-> %
				const relativeY = (100 * absoluteY) / window.innerHeight //-> %
				vector = { x: relativeX, y: relativeY }

				// Force override YouTube important declarations during drag
				this.container.style.setProperty('transform', 'none', 'important')
				this.container.style.setProperty('left', `${vector.x}%`, 'important')
				this.container.style.setProperty('top', `${vector.y}%`, 'important')
			}
		})

		document.addEventListener('mouseup', (e) => {
			if (!isDragging) return
			
			const deltaX = Math.abs(e.clientX - initX)
			const deltaY = Math.abs(e.clientY - initY)

			if (deltaX < drag_treshold && deltaY < drag_treshold) {
				// Small movement = click, only reset intention if not editing
				if (this.input.contentEditable === 'false') {
					this.resetAndEditIntention()
				}
			} else {
				// Large movement = drag, save position
				sessionStorage.setItem(
					`${extensionID}-position`,
					JSON.stringify(vector)
				)
			}

			isDragging = false
			this.container.classList.remove('is-about-to-drag')
			this.container.classList.remove('is-dragging')
		})
	}

	setupTimerEvents() {
		const timerBtns = this.shadowRoot.querySelectorAll('.timer-btn')
		const customTimer = this.shadowRoot.getElementById('customTimer')
		const customMinutes = this.shadowRoot.getElementById('customMinutes')
		const startTimerBtn = this.shadowRoot.getElementById('startTimer')
		const newTaskBtn = this.shadowRoot.getElementById('newTaskBtn')
		const extendBtn = this.shadowRoot.getElementById('extendBtn')

		let selectedMinutes = null

		// Timer option selection
		timerBtns.forEach(btn => {
			btn.addEventListener('click', () => {
				// Remove previous selections
				timerBtns.forEach(b => b.classList.remove('selected'))
				btn.classList.add('selected')

				const minutes = btn.dataset.minutes
				if (minutes === 'no-timer') {
					customTimer.classList.remove('visible')
					selectedMinutes = 'no-timer'
					startTimerBtn.textContent = 'Continue without timer'
				} else if (minutes === 'custom') {
					customTimer.classList.add('visible')
					selectedMinutes = parseInt(customMinutes.value)
					startTimerBtn.textContent = 'Start Timer'
				} else {
					customTimer.classList.remove('visible')
					selectedMinutes = parseInt(minutes)
					startTimerBtn.textContent = 'Start Timer'
				}
				startTimerBtn.disabled = false
				
				// Store selected button for keeping it visible during timer
				this.selectedTimerButton = btn
			})
		})

		// Custom timer input
		customMinutes.addEventListener('input', () => {
			selectedMinutes = parseInt(customMinutes.value)
		})

		// Start timer button
		startTimerBtn.addEventListener('click', () => {
			if (selectedMinutes === 'no-timer') {
				this.startInfiniteSession()
			} else if (selectedMinutes && selectedMinutes > 0) {
				this.startTimer(selectedMinutes)
			}
		})

		// Timer complete dialog buttons
		newTaskBtn.addEventListener('click', () => {
			this.finishSession()
		})

		extendBtn.addEventListener('click', () => {
			this.extendTimer(5)
		})
	}

	setupFeedbackEvents() {
		const npsButtons = this.shadowRoot.querySelectorAll('.nps-button')
		const feedbackSubmit = this.shadowRoot.getElementById('feedbackSubmit')
		const feedbackSkip = this.shadowRoot.getElementById('feedbackSkip')
		const feedbackDetailed = this.shadowRoot.getElementById('feedbackDetailed')
		const feedbackContact = this.shadowRoot.getElementById('feedbackContact')
		const feedbackClose = this.shadowRoot.getElementById('feedbackClose')

		let selectedNPS = null

		// NPS button selection
		npsButtons.forEach(btn => {
			btn.addEventListener('click', () => {
				npsButtons.forEach(b => b.classList.remove('selected'))
				btn.classList.add('selected')
				selectedNPS = parseInt(btn.dataset.score)
				feedbackSubmit.disabled = false
			})
		})

		// Submit NPS score
		feedbackSubmit.addEventListener('click', () => {
			if (selectedNPS !== null) {
				const category = getNPSCategory(selectedNPS)
				saveNPSScore(selectedNPS, category).then(() => {
					this.showFeedbackThankYou(selectedNPS, category)
				}).catch(err => {
					console.error('Failed to save NPS score:', err)
				})
			}
		})

		// Skip feedback
		feedbackSkip.addEventListener('click', () => {
			markFeedbackRequested().then(() => {
				this.hideFeedbackDialog()
			})
		})

		// Contact support
		feedbackContact.addEventListener('click', () => {
			// Open email client with pre-filled support email
			const subject = encodeURIComponent('Mindlessly Support Request')
			const body = encodeURIComponent('Hi there!\n\nI need help with Mindlessly extension.\n\nIssue: \n\nThanks!')
			window.open(`mailto:divykairoth@gmail.com?subject=${subject}&body=${body}`, '_blank')
		})

		// Close feedback dialog
		feedbackClose.addEventListener('click', () => {
			this.hideFeedbackDialog()
		})
	}

	showFeedbackDialog() {
		this.feedbackDialog.classList.add('visible')
		this.veil.classList.add('isVisible')
		
		// Reset to initial state
		this.feedbackContent.style.display = 'block'
		this.feedbackThankYou.classList.remove('visible')
		
		// Reset NPS selection
		const npsButtons = this.shadowRoot.querySelectorAll('.nps-button')
		npsButtons.forEach(btn => btn.classList.remove('selected'))
		this.shadowRoot.getElementById('feedbackSubmit').disabled = true
	}

	hideFeedbackDialog() {
		this.feedbackDialog.classList.remove('visible')
		this.veil.classList.remove('isVisible')
	}

	showFeedbackThankYou(npsScore, category) {
		this.feedbackContent.style.display = 'none'
		this.feedbackThankYou.classList.add('visible')
		
		// Set up detailed feedback link based on NPS category
		const detailedLink = this.shadowRoot.getElementById('feedbackDetailed')
		let formUrl = ''
		
		if (category === 'promoter') {
			// High scores - ask for testimonials and feature requests
			formUrl = 'https://divykairoth.notion.site/29b64a8c4ea0802b94d8d3714a0b9ac4?pvs=105'
			detailedLink.textContent = 'Share what you love'
		} else if (category === 'passive') {
			// Mid scores - ask for improvement suggestions
			formUrl = 'https://divykairoth.notion.site/29b64a8c4ea081de9b18c359fd050c4a?pvs=105'
			detailedLink.textContent = 'Help us improve'
		} else {
			// Low scores - ask for specific issues
			formUrl = 'https://divykairoth.notion.site/29b64a8c4ea081cca33cdf72103619b1?pvs=105'
			detailedLink.textContent = 'Tell us what\'s wrong'
		}
		
		detailedLink.href = formUrl
	}

	async checkAndShowFeedback() {
		try {
			const { shouldRequest, sessionCount } = await shouldRequestFeedback()
			
			if (shouldRequest) {
				// Show feedback dialog after a short delay
				setTimeout(() => {
					this.showFeedbackDialog()
					markFeedbackRequested()
				}, 2000) // 2 second delay after session completion
			}
		} catch (error) {
			console.error('Error checking feedback eligibility:', error)
		}
	}

	showTimerSelection() {
		// Check if timer is already running
		const timerState = sessionStorage.getItem(`${extensionID}-timer`)
		if (timerState) {
			const timer = JSON.parse(timerState)
			if (timer.active) {
				this.resumeTimer(timer)
				return
			}
		}

		this.showFullTimerSelection()
		this.timerSelection.classList.add('visible')
		this.veil.classList.add('isVisible')
	}

	hideTimerSelection() {
		this.timerSelection.classList.remove('visible')
		this.veil.classList.remove('isVisible')
	}
	
	showCompactTimerSelection() {
		// Hide the timer selection completely after starting timer
		this.hideTimerSelection()
	}
	
	showFullTimerSelection() {
		// Show full timer selection interface
		this.timerSelection.classList.remove('compact')
		
		// Show all buttons and reset their styling
		const timerBtns = this.shadowRoot.querySelectorAll('.timer-btn')
		timerBtns.forEach(btn => {
			btn.style.display = 'inline-block'
			// Remove inverted styling when showing full selection
			btn.classList.remove('inverted')
		})
		
		// Show the start button
		const startTimerBtn = this.shadowRoot.getElementById('startTimer')
		startTimerBtn.style.display = 'block'
		
		// Show the title
		const title = this.timerSelection.querySelector('h3')
		if (title) title.style.display = 'block'
	}

	startTimer(minutes) {
		const totalSeconds = minutes * 60
		const startTime = Date.now()
		const endTime = startTime + (totalSeconds * 1000)

		this.currentTimer = {
			active: true,
			totalSeconds,
			startTime,
			endTime,
			minutes,
			selectedButtonText: this.selectedTimerButton ? this.selectedTimerButton.textContent : null
		}

		// Reset completion flag for new timer
		this.timerCompleted = false

		// Save timer state
		sessionStorage.setItem(`${extensionID}-timer`, JSON.stringify(this.currentTimer))

		this.hideTimerSelection()
		this.showTimerCircle()
		this.updateTimerDisplay()

		// Start the countdown
		this.timerInterval = setInterval(() => {
			this.updateTimerDisplay()
		}, 1000)
	}

	startInfiniteSession() {
		// Clear any existing timer
		if (this.timerInterval) {
			clearInterval(this.timerInterval)
			this.timerInterval = null
		}

		// Set infinite session state
		this.currentTimer = {
			active: true,
			infinite: true,
			startTime: Date.now(),
			selectedButtonText: this.selectedTimerButton ? this.selectedTimerButton.textContent : null
		}

		// Reset completion flag
		this.timerCompleted = false

		// Save timer state
		sessionStorage.setItem(`${extensionID}-timer`, JSON.stringify(this.currentTimer))

		this.hideTimerSelection()
		// Don't show timer circle for infinite sessions
		// this.showTimerCircle()
	}

	resumeTimer(timer) {
		// Handle infinite sessions
		if (timer.infinite) {
			this.currentTimer = timer
			
			// Restore the selected button based on saved text
			if (timer.selectedButtonText) {
				const timerBtns = this.shadowRoot.querySelectorAll('.timer-btn')
				timerBtns.forEach(btn => {
					if (btn.textContent === timer.selectedButtonText) {
						this.selectedTimerButton = btn
					}
				})
			}
			
			// Don't show timer circle for infinite sessions
			return
		}

		const now = Date.now()
		if (now >= timer.endTime) {
			this.timerComplete()
			return
		}

		this.currentTimer = timer
		
		// Restore the selected button based on saved text
		if (timer.selectedButtonText) {
			const timerBtns = this.shadowRoot.querySelectorAll('.timer-btn')
			timerBtns.forEach(btn => {
				if (btn.textContent === timer.selectedButtonText) {
					this.selectedTimerButton = btn
				}
			})
		}
		
		this.showCompactTimerSelection()
		this.showTimerCircle()
		this.updateTimerDisplay()

		this.timerInterval = setInterval(() => {
			this.updateTimerDisplay()
		}, 1000)
	}

	showTimerCircle() {
		this.container.classList.add('has-timer')
		this.timerCircle.style.display = 'block'
		// Hide clock icon when timer is active
		const clockIcon = this.shadowRoot.getElementById('clockIcon')
		if (clockIcon) clockIcon.style.display = 'none'
	}

	hideTimerCircle() {
		this.container.classList.remove('has-timer')
		this.timerCircle.style.display = 'none'
		// Show clock icon when timer is not active
		const clockIcon = this.shadowRoot.getElementById('clockIcon')
		if (clockIcon) clockIcon.style.display = 'block'
	}

	updateTimerDisplay() {
		if (!this.currentTimer) return

		// Skip display updates for infinite sessions
		if (this.currentTimer.infinite) return

		const now = Date.now()
		const remaining = Math.max(0, this.currentTimer.endTime - now)
		const remainingSeconds = Math.ceil(remaining / 1000)

		if (remainingSeconds <= 0 && !this.timerCompleted) {
			this.timerCompleted = true
			this.timerComplete()
			return
		}

		// Update timer text
		const minutes = Math.floor(remainingSeconds / 60)
		const seconds = remainingSeconds % 60
		const displayTime = minutes > 0 ? `${minutes}m` : `${seconds}s`
		this.timerText.textContent = displayTime

		// Update circular progress
		const progress = (this.currentTimer.totalSeconds - remainingSeconds) / this.currentTimer.totalSeconds
		const circumference = 2 * Math.PI * 10 // radius = 10
		const offset = circumference * (1 - progress)
		
		const circle = this.shadowRoot.querySelector('.circle-progress')
		circle.style.strokeDashoffset = offset
	}

	timerComplete() {
		// Clear timer
		if (this.timerInterval) {
			clearInterval(this.timerInterval)
			this.timerInterval = null
		}

		// Show completion dialog
		this.timerCompleteDialog.classList.add('visible')
		this.veil.classList.add('isVisible')
	}

	extendTimer(additionalMinutes) {
		if (this.currentTimer) {
			// Add exactly the specified minutes in milliseconds
			const additionalMs = additionalMinutes * 60 * 1000
			this.currentTimer.endTime += additionalMs
			
			// Update total seconds for progress calculation
			const now = Date.now()
			const totalRemaining = Math.max(0, this.currentTimer.endTime - now)
			this.currentTimer.totalSeconds = Math.ceil(totalRemaining / 1000)
			
			sessionStorage.setItem(`${extensionID}-timer`, JSON.stringify(this.currentTimer))
		}

		// Reset completion flag since timer is extended
		this.timerCompleted = false

		this.timerCompleteDialog.classList.remove('visible')
		this.veil.classList.remove('isVisible')

		// Restart the interval if needed
		if (!this.timerInterval) {
			this.timerInterval = setInterval(() => {
				this.updateTimerDisplay()
			}, 1000)
		}
	}

	resetAndEditIntention() {
		// Clear any running timer
		if (this.timerInterval) {
			clearInterval(this.timerInterval)
			this.timerInterval = null
		}

		this.currentTimer = null
		this.selectedTimerButton = null
		this.timerCompleted = false
		sessionStorage.removeItem(`${extensionID}-timer`)

		// Hide timer UI elements
		this.hideTimerCircle()
		this.timerCompleteDialog.classList.remove('visible')
		this.timerSelection.classList.remove('visible')
		this.veil.classList.remove('isVisible')

		// Reset timer selection to full view
		this.showFullTimerSelection()

		// Enable editing of the intention
		this.input.contentEditable = true
		this.input.focus()
		
		// Select all text for easy replacement
		if (this.input.innerHTML) {
			const range = document.createRange()
			range.selectNodeContents(this.input)
			const selection = this.shadowRoot.getSelection()
			selection.removeAllRanges()
			selection.addRange(range)
		}
	}

	finishSession() {
		// Track session completion for feedback system
		trackSessionCompletion().then(() => {
			// Check if we should show feedback after tracking
			this.checkAndShowFeedback()
		}).catch(err => {
			console.error('Failed to track session completion:', err)
		})

		// Clear all timer data
		if (this.timerInterval) {
			clearInterval(this.timerInterval)
			this.timerInterval = null
		}

		this.currentTimer = null
		this.selectedTimerButton = null
		this.timerCompleted = false
		sessionStorage.removeItem(`${extensionID}-timer`)
		sessionStorage.removeItem(`${extensionID}-intention`)

		// Hide all UI elements
		this.hideTimerCircle()
		this.timerCompleteDialog.classList.remove('visible')
		this.timerSelection.classList.remove('visible')
		this.veil.classList.remove('isVisible')

		// Reset timer selection to full view
		this.showFullTimerSelection()

		// Reset the intention input
		this.input.innerHTML = ''
		this.input.contentEditable = true
		this.input.focus()
	}

	connectedCallback() {
		if (sessionStorage.getItem(`${extensionID}-position`)) {
			const storage = sessionStorage.getItem(`${extensionID}-position`)
			const pos = JSON.parse(storage)
			if (pos.x > -1 && pos.y > -1) {
				// Use setProperty to override YouTube important declarations
				this.container.style.setProperty('transform', 'none', 'important')
				this.container.style.setProperty('left', `${pos.x}%`, 'important')
				this.container.style.setProperty('top', `${pos.y}%`, 'important')
			}
		}

		// Check for existing intention and timer
		const existingIntention = sessionStorage.getItem(`${extensionID}-intention`)
		const existingTimer = sessionStorage.getItem(`${extensionID}-timer`)

		if (existingIntention) {
			this.input.innerHTML = existingIntention
			this.input.contentEditable = 'false'
			
			if (existingTimer) {
				const timer = JSON.parse(existingTimer)
				if (timer.active) {
					this.resumeTimer(timer)
				} else {
					this.showTimerSelection()
				}
			} else {
				this.showTimerSelection()
			}
		} else {
			this.input.contentEditable = true
			this.input.focus()
			
			// Only protect focus on LinkedIn during initial load
			if (window.location.hostname.includes('linkedin.com')) {
				this.startLinkedInFocusProtection()
			}
		}
	}

	insertAtCursor(character) {
		const root = this.shadowRoot
		if (root.getSelection && root.getSelection().getRangeAt) {
			const range = root.getSelection().getRangeAt(0)
			const node = range.createContextualFragment(character)
			range.deleteContents()
			range.insertNode(node)
			root.getSelection().collapseToEnd()
			root.getSelection().modify('move', 'forward', 'character')
		}
	}
}

customElements.define('intention-container', Intention)

// YouTube-specific initialization
function initializeExtension() {
	// Remove any existing containers to prevent duplicates
	const existingContainers = document.querySelectorAll('intention-container')
	existingContainers.forEach(container => container.remove())
	
	// Create and inject new container
	const container = document.createElement('intention-container')
	
	// YouTube-specific insertion method
	if (window.location.hostname.includes('youtube.com')) {
		// Wait for YouTube to finish loading and use a more stable insertion point
		const insertContainer = () => {
			const body = document.body || document.documentElement
			if (body) {
				body.appendChild(container)
				// Ensure container stays visible on YouTube
				setTimeout(() => {
					if (container.parentNode) {
						container.style.setProperty('display', 'block', 'important')
						container.style.setProperty('visibility', 'visible', 'important')
					}
				}, 100)
			}
		}
		
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', insertContainer)
		} else {
			insertContainer()
		}
		
		// Re-inject if YouTube navigation removes it
		let observer = new MutationObserver(() => {
			if (!document.body.contains(container)) {
				document.body.appendChild(container)
			}
		})
		observer.observe(document.body, { childList: true, subtree: true })
		
	} else {
		// Standard insertion for other sites
		if (document.body) {
			document.body.prepend(container)
		} else {
			document.addEventListener('DOMContentLoaded', () => {
				document.body.prepend(container)
			})
		}
	}
}

// Initialize the extension
initializeExtension()
