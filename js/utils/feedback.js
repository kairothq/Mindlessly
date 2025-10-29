/**
 * @file Utility functions for feedback collection and usage tracking.
 * Tracks user sessions and triggers feedback requests after 3 completed sessions.
 */

/**
 * Track when a user completes a session (timer finishes or new task started)
 * @returns Promise if tracking operation succeeded
 */
const trackSessionCompletion = function trackUsageSession() {
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

			// Increment session count
			stats.sessionsCompleted += 1
			stats.lastSessionDate = Date.now()

			chrome.storage.local.set({ usageStats: stats }, () => {
				if (chrome.runtime.lastError) {
					return reject(chrome.runtime.lastError)
				}
				
				console.log(`Session completed. Total sessions: ${stats.sessionsCompleted}`)
				resolve(stats)
			})
		})
	})
}

/**
 * Check if user should be shown feedback request
 * @returns Promise with boolean indicating if feedback should be requested
 */
const shouldRequestFeedback = function checkFeedbackEligibility() {
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

			// Request feedback after 3 sessions, but only once unless declined and more sessions completed
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

/**
 * Mark that feedback has been requested
 * @returns Promise if operation succeeded
 */
const markFeedbackRequested = function recordFeedbackRequest() {
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

/**
 * Save NPS score and mark feedback as given
 * @param {number} score - NPS score from 0-10
 * @param {string} category - 'promoter', 'passive', or 'detractor'
 * @returns Promise if operation succeeded
 */
const saveNPSScore = function saveUserNPSRating(score, category) {
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
				
				console.log(`NPS score saved: ${score} (${category})`)
				resolve(stats)
			})
		})
	})
}

/**
 * Get NPS category based on score
 * @param {number} score - Score from 0-10
 * @returns {string} - 'detractor', 'passive', or 'promoter'
 */
const getNPSCategory = function categorizeNPSScore(score) {
	if (score <= 6) return 'detractor'
	if (score <= 8) return 'passive'
	return 'promoter'
}

/**
 * Get usage statistics
 * @returns Promise with usage stats object
 */
const getUsageStats = function retrieveUsageStatistics() {
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

			resolve(stats)
		})
	})
}

export { 
	trackSessionCompletion, 
	shouldRequestFeedback, 
	markFeedbackRequested, 
	saveNPSScore, 
	getNPSCategory,
	getUsageStats 
}
