/* global Module */

Module.register("MMM-SMHI-Alerts", {
    defaults: {
        area: "Västra Götalands län",
        updateInterval: 15 * 60 * 1000 // 15 min
    },

    start: function () {
        this.alerts = [];
        this.sendSocketNotification("GET_ALERTS", this.config);
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "ALERTS_RESULT") {
            this.alerts = payload;
            this.updateDom();
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");

        if (this.alerts.length === 0) {
            wrapper.innerHTML = "✅ Inga aktuella vädervarningar";
            wrapper.className = "dimmed small";
            return wrapper;
        }

        this.alerts.forEach(alert => {
            const div = document.createElement("div");
            div.className = "bright small";

            const icon = alert.severity === "Red" ? "🔴" :
                         alert.severity === "Orange" ? "🟠" :
                         "🟡";

            div.innerHTML = `${icon} <strong>${alert.event}</strong> – ${alert.description} <br><span class="dimmed">${alert.areaDesc} (${alert.effective} → ${alert.expires})</span>`;
            wrapper.appendChild(div);
        });

        return wrapper;
    }
});
