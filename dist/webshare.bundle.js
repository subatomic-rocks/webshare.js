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
webshare.addPlatform({
    name: 'facebook',
    icon: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.676 0H1.324C.593 0 0 .593 0 1.324v21.352C0 23.408.593 24 1.324 24h11.494v-9.294H9.689v-3.621h3.129V8.41c0-3.099 1.894-4.785 4.659-4.785 1.325 0 2.464.097 2.796.141v3.24h-1.921c-1.5 0-1.792.721-1.792 1.771v2.311h3.584l-.465 3.63H16.56V24h6.115c.733 0 1.325-.592 1.325-1.324V1.324C24 .593 23.408 0 22.676 0"/></svg>',
    handler: (args, handlers) => {
        try {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURI(args.url)}`);
            handlers.ok();
        } catch (e) {
            handlers.error(e);
        }
    }
});
webshare.addPlatform({
    name: 'native',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.6,0H1.4C0.6,0,0,0.7,0,1.5v20.9C0,23.3,0.6,24,1.4,24h21.1c0.8,0,1.4-0.7,1.4-1.5V1.5C24,0.7,23.4,0,22.6,0z M7.5,12c0,0,0,0.1,0,0.1l9.6,3.9c0.4-0.5,1-0.8,1.7-0.8c1.3,0,2.3,1,2.3,2.3c0,1.3-1,2.3-2.3,2.3s-2.3-1-2.3-2.3c0,0,0-0.1,0-0.1l-9.6-3.9c-0.4,0.5-1,0.8-1.7,0.8c-1.3,0-2.3-1-2.3-2.3s1-2.3,2.3-2.3c0.7,0,1.3,0.3,1.7,0.8l9.6-4c0,0,0-0.1,0-0.1c0-1.3,1-2.3,2.3-2.3s2.3,1,2.3,2.3s-1,2.3-2.3,2.3c-0.7,0-1.3-0.3-1.7-0.8l-9.6,4C7.5,11.9,7.5,12,7.5,12z"/></svg>',
    requiresNativeSupport: true,
    handler: (args, handlers) => {
        navigator.share(args).then(handlers.ok).catch(handlers.error);
    }
});
webshare.addPlatform({
    name: 'twitter',
    icon: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.896-.959-2.173-1.559-3.591-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63.961-.689 1.8-1.56 2.46-2.548l-.047-.02z"/></svg>',
    handler: (args, handlers) => {
        try {
            window.open(`https://twitter.com/home?status=${args.title}%20${encodeURI(args.url)}%20${args.text}`);
            handlers.ok();
        } catch (e) {
            handlers.error(e);
        }
    }
});
webshare.addPlatform({
    name: 'whatsapp',
    icon: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"/></svg>',
    handler: (args, handlers) => {
        try {
            window.open(`https://api.whatsapp.com/send?text=${args.title}%20${encodeURI(args.url)}%20${args.text}`);
            handlers.ok();
        } catch (e) {
            handlers.error(e);
        }
    }
});