const topic = import.meta.env.VITE_NTFY_TOPIC;
const HEARTBEAT_INTERVAL = 60000;

export const push = async message => {
    if (!topic) return;
    await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        body: message,
    });
};

export const subscribe = callback => {
    if (!topic) return () => {};

    let ws = null;
    let retryDelay = 1000;
    let stopped = false;

    const connect = () => {
        ws = new WebSocket(`wss://ntfy.sh/${topic}/ws`);
        let heartbeat = null;

        ws.onmessage = event => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'message') {
                    callback(data.message);
                }
            } catch (_) {}
        };

        ws.onopen = () => {
            retryDelay = 1000;
            heartbeat = setInterval(() => {
                if (ws.readyState !== WebSocket.OPEN) {
                    ws.close();
                }
            }, HEARTBEAT_INTERVAL);
        };

        ws.onclose = () => {
            clearInterval(heartbeat);
            if (stopped) return;
            setTimeout(connect, retryDelay);
            retryDelay = Math.min(retryDelay * 2, 30000);
        };

        ws.onerror = () => {
            ws.close();
        };
    };

    connect();

    return () => {
        stopped = true;
        ws?.close();
    };
};

export const buildCommand = (name, params = {}) => `${name}(${JSON.stringify(params)})`;

export const parseCommand = str => {
    const normalized = /\(.*\)$/.test(str) ? str.replace(/\(\s*\)$/, '({})') : `${str}({})`;
    const match = normalized.match(/^([^(]+)\((.+)\)$/s);
    if (!match) return null;
    try {
        return { name: match[1], params: JSON.parse(match[2]) };
    } catch (_) {
        return null;
    }
};
