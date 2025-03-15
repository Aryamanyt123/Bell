var form = document.getElementById("form");
var input = document.getElementById("input");
var input2 = document.getElementById("input-2");
var discord = document.getElementById("discord");
const webhookUrl = 'https://discord.com/api/webhooks/1350289177022955550/9C7mMg7MqdkReE-f3xg9AqSsqjb_0ZyrQZ66z7KZk3LitgzDCYJ7kZQt2dtTMpuy1NDQ';

async function sendToDiscordWebhook(url, userId) {
    const data = {
        content: `URL: ${url}\nUser ID: ${userId}`,
        username: "Form Submission"
    };

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        console.log('Data sent to Discord webhook successfully.');
    } catch (error) {
        console.error('Error sending data to Discord webhook:', error);
    }
}

async function init() {
    try {
        const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
        const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
        if (localStorage.getItem("transport") == "epoxy") {
            if (await connection.getTransport() !== "/epoxy/index.mjs") {
                await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
                console.log("Using websocket transport. Wisp URL is: " + wispUrl);
            }
        }
        else {
            if (await connection.getTransport() !== "/libcurl/index.mjs") {
                await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
                console.log("Using websocket transport. Wisp URL is: " + wispUrl);
            }
        }

    } catch (err) {
        console.error("An error occurred while setting up baremux:", err);
    }
    try {
        const scramjet = new ScramjetController({
            prefix: "/scram/service/",
            files: {
                wasm: "/scram/scramjet.wasm.js",
                worker: "/scram/scramjet.worker.js",
                client: "/scram/scramjet.client.js",
                shared: "/scram/scramjet.shared.js",
                sync: "/scram/scramjet.sync.js"
            },
            flags: {
                syncxhr: true
            }
        });
        window.sj = scramjet;
        scramjet.init("/sw.js");


    } catch (error) {
        console.error("Error setting up uv & sj:", error);
    }
    if (!localStorage.getItem("proxy")) {
        localStorage.setItem("proxy", "uv");
    }

    try {
        await navigator.serviceWorker.register("/sw.js");
        console.log("Registering service worker...");
    } catch (err) {
        throw new Error(err)
    }
}
init();

if (form && input && input2) {
    form.addEventListener("submit", async (event) => {
        function isUrl(val = "") {
            if (
                /^http(s?):\/\//.test(val) ||
                (val.includes(".") && val.substr(0, 1) !== " ")
            ) {
                return true;
            }
            return false;
        }

        event.preventDefault();

        if (!localStorage.getItem("proxy")) {
            localStorage.setItem("proxy", "uv");
        }

        try {
            await navigator.serviceWorker.register("/sw.js");
            console.log("Registering service worker...");
        } catch (err) {
            throw new Error(err)
        }

        var url = input.value.trim();
        var userId = input2.value.trim();

        if (!/^\d{6}$/.test(userId)) {
            alert('Please enter a valid 6-digit ID.');
            return;
        }

        if (!isUrl(url)) {
            if (localStorage.getItem("engine") == "google") {
                url = "https://www.google.com/search?q=" + url;
            }
            else {
                url = "https://duckduckgo.com/?t=h_&q=" + url;
            }

        } else if (!(url.startsWith("https://") || url.startsWith("http://"))) {
            url = `https://${url}`;
        }

        // Send the URL and User ID to the Discord webhook
        await sendToDiscordWebhook(url, userId);

        if (localStorage.getItem("proxy") == "uv") {
            uvEncode();
        }
        else if (localStorage.getItem("proxy") == "sj") {
            sjEncode();
        }
        else if (localStorage.getItem("proxy") == "rammerhead") {
            rhEncode();
        }

        async function rhEncode() {
            url = await RammerheadEncode(url);
            window.location.href = "/" + url;
        }
        async function uvEncode() {
            url = __uv$config.prefix + __uv$config.encodeUrl(url);
            localStorage.setItem("url", url);
            window.location.href = "/browser";
        }
        async function sjEncode() {
            url = "/scram/service/" + encodeURIComponent(url);
            localStorage.setItem("url", url);
            window.location.href = "/browser";
        }
    });
}

if (discord) {
    discord.addEventListener("click", async (event) => {
        await navigator.clipboard.writeText("https://discord.gg/Td7v7Acm5s");
        alert('💪🔥 Invite link copied to clipboard!');
    });
}
