/**
 * @file Background service worker for Mindlessly extension that watches browser 
 * navigation and injects content scripts for mindful browsing with timer features.
 */

let STORAGE_CACHE

// Initialize cache on extension startup
chrome.storage.local.get(undefined, (storage) => {
	STORAGE_CACHE = storage
})

/**
 * Run on install (or update).
 * TODO: add uninstall page
 */
chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
		const initialStorage = {
			sites: {
				'0': 'www.youtube.com',
				'1': 'www.instagram.com',
				'2': 'twitter.com',
				'3': 'x.com',
				'4': 'www.facebook.com'
			},
			time: { active: false, use24Hrs: true, from: '09:00', to: '17:00' },
			user: { name: '', email: '', premiumUntil: null, onboarded: false }
		}
		
		// Set storage and update cache immediately
		chrome.storage.local.set(initialStorage, () => {
			STORAGE_CACHE = initialStorage
		})
		
		//chrome.runtime.setUninstallURL('https://example.com/extension-survey');
		const url = chrome.runtime.getURL('onboarding.html')
		chrome.tabs.create({ url })
	} else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
		const url = chrome.runtime.getURL('changelog.html')
		chrome.tabs.create({ url })
	}
})

/**
 * Watches for storage changes since storage is cached.
 */
chrome.storage.onChanged.addListener((changes) => {
	for (let [key, { newValue }] of Object.entries(changes)) {
		if (!STORAGE_CACHE) return
		STORAGE_CACHE[key] = newValue
	}
})

/**
 * Watches for webNavigation events.
 */
chrome.webNavigation.onCommitted.addListener(handleNavigation)

/**
 * Handle webNavigation and inject content script if URL matches.
 * @param {Object} data - Contains properties about webNavigation destination
 */
function handleNavigation(data) {
	if (!data.url) return

	const url = new URL(data.url)

	// Prevent extension triggering on embedded content
	if (data.transitionType === 'auto_subframe') return

	// Skip chrome://, edge://, about:, and other restricted URLs
	// These cannot be accessed by extensions and will cause errors
	const restrictedProtocols = ['chrome:', 'chrome-extension:', 'edge:', 'about:', 'devtools:', 'view-source:']
	if (restrictedProtocols.includes(url.protocol)) return

	function handleInjection(_data) {
		const { sites, time } = STORAGE_CACHE

		if (time.active) {
			// Compare strings using lexicographic order
			// to allow timeframes between two days (ex: 23:00 to 02:00)
			const now = new Date()
			const h = now.getHours()
			const m = now.getMinutes()
			const hh_mm = `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`

			const isActive = time.from < hh_mm && time.to > hh_mm

			if (!isActive) return
		}

		// Check if hostname matches any tracked site
		// Support both exact matches and subdomain matches (e.g., old.reddit.com matches reddit.com)
		const hostname = url.hostname
		const matchesSite = Object.values(sites).some((site) => {
			// Exact match
			if (site === hostname) return true
			// Subdomain match: check if hostname ends with the site domain
			// e.g., old.reddit.com ends with reddit.com
			if (hostname.endsWith('.' + site.replace(/^www\./, ''))) return true
			// Also check without www prefix on the tracked site
			const siteWithoutWww = site.replace(/^www\./, '')
			if (hostname === siteWithoutWww || hostname.endsWith('.' + siteWithoutWww)) return true
			return false
		})

		if (matchesSite) {
			// Inject WebComponents polyfill since Webcomponents are
			// not supported (yet), see: https://bugs.chromium.org/p/chromium/issues/detail?id=390807#c59
			//
			// We also have to inject the polyfill here since executeScript doesn't support modules (yet)
			try {
				chrome.scripting.executeScript({
					target: { tabId: _data.tabId },
					files: ['js/polyfills/custom-elements.min.js']
				}).then(() => {
					// Check for errors before continuing
					if (chrome.runtime.lastError) {
						console.log('Mindlessly: Cannot inject on this page:', chrome.runtime.lastError.message)
						return
					}
					return chrome.scripting.executeScript({
						target: { tabId: _data.tabId },
						files: ['js/inject.js']
					})
				}).catch(err => {
					console.log('Mindlessly: Script injection failed:', err?.message || err)
				})
			} catch (err) {
				console.log('Mindlessly: Injection error:', err?.message || err)
			}

			try {
				chrome.scripting.insertCSS({
					target: { tabId: _data.tabId },
					files: ['style/inject.css']
				}).catch(err => {
					console.log('Mindlessly: CSS injection failed:', err?.message || err)
				})
			} catch (err) {
				console.log('Mindlessly: CSS error:', err?.message || err)
			}
		}
	}

	if (!STORAGE_CACHE) {
		chrome.storage.local.get(undefined, (storage) => {
			STORAGE_CACHE = storage
			handleInjection(data)
		})
	} else {
		handleInjection(data)
	}
}
