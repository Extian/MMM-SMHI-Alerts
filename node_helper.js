const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
    start: function () {
        console.log("MMM-SMHI-Alerts helper started ...");
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "GET_ALERTS") {
            this.config = payload;
            this.getAlerts();
            setInterval(() => {
                this.getAlerts();
            }, this.config.updateInterval);
        }
    },

    async getAlerts() {
        try {
            const url = "https://opendata.smhi.se/apidocs/metalerts/2.0/alerts.json";
            const res = await fetch(url);
            const json = await res.json();

            // Filtrera ut varningar för rätt område
            const alerts = (json.alerts || []).filter(a =>
                a.areaDesc.includes(this.config.area)
            ).map(a => ({
                event: a.event,
                description: a.description,
                severity: a.severity,
                areaDesc: a.areaDesc,
                effective: a.effective,
                expires: a.expires
            }));

            this.sendSocketNotification("ALERTS_RESULT", alerts);
        } catch (err) {
            console.error("SMHI Alerts error:", err);
            this.sendSocketNotification("ALERTS_RESULT", []);
        }
    }
});
