/**
 * webshare.js
 * A simple and effective wrapper to Web Sharing API with HTML fallback.
 */

window.webshare = (function () {
    // Web Share API requires HTTPS, also test for browser support
    let isNativeShareSupported = location.protocol == 'https:' && navigator.share;

    // Our supported share platforms
    let platforms = {};
    this.addPlatform = function addPlatform (platform) {
        platforms[platform.name] = platform;
    }
    this.getPlatforms = function getPlatforms () {
        return Object.keys(platforms);
    }

    // Event handlers
    let events = {};
    this.on = function on (event, handler) {
        if (!events[event]) events[event] = [];
        events[event].push(handler);
    }
    let trigger = function trigger (event, args) {
        if (!events[event]) return;
        events[event].map(handler => {
            handler.apply(window.webshare, args);
        });
    }

    // Detects platform support
    function isPlatformSupported (platform) {
        // Check for native requirement/support
        if (platform.requiresNativeSupport && !isNativeShareSupported) return false;

        // Default to yes
        return true;      
    }

    // This function will be called when the share buttons are clicked
    function invokeShare (platformId, args) {
        // Test if the platform exists
        let platform = platforms[platformId];
        if (!platform) throw 'Platform unknown.';

        // Handle both native and HTML sharing here
        if (!isPlatformSupported) throw 'Platform is not supported.';

        console.log(args);

        /**
         * Creates the arguments being passed to our share.
         * Defaults:
         * title: OpenGraph Title or Document Title
         * url: Canonical URL or Document URL
         */
        args = Object.assign(Object.assign({
            url: document.querySelector("link[rel='canonical']") ? document.querySelector("link[rel='canonical']").href : document.location.href,
            title: document.querySelector("meta[name='og:title']") ? document.querySelector("meta[name='og:title']").content : document.title,
            text: ''
        }, args, (args.social ? args.social[platformId] : {})));
        
        // Run code
        platform.handler(args, {
            ok: () => { trigger('success', [platformId, args, ...arguments]); },
            error: () => { trigger('error', [platformId, args, ...arguments]); }
        });
    }

    // Render function
    this.render = function render (element, options) {
        // Options defaults
        options = Object.assign({
            className: 'webshare',
            platforms: 'all',
            nativePlatforms: ['native'],
            args: {}
        }, options);

        // Handle "all" in options
        options.platforms = (options.platforms == 'all') ? this.getPlatforms() : options.platforms;
        options.nativePlatforms = (options.nativePlatforms == 'all') ? this.getPlatforms() : options.nativePlatforms;

        // Generate HTML wrapper
        let wrapper = document.createElement('div');
        wrapper.className = options.className;

        // Define our target platforms
        let targetPlatforms = isNativeShareSupported ? options.nativePlatforms : options.platforms;

        // Add them to the wrapper
        targetPlatforms.map(platformId => {
            // Get platform data
            let platform = platforms[platformId];

            // Create element
            let platformElement = document.createElement('a');
            platformElement.href = '#';
            platformElement.onclick = function () { invokeShare(platformId, options.args); return false; }
            platformElement.innerHTML = platform.icon;
            platformElement.className = options.className + '-platform ' + options.className + '-platform-' + platformId;

            // Append element
            wrapper.appendChild(platformElement);
        });

        // Add wrapper to element
        element.appendChild(wrapper);
    }

    return this;
})();