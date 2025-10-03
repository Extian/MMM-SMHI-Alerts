/* MagicMirror²
 * Module: MMM-SMHI-Alerts
 */

const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-SMHI-Alerts helper started...");
  },

  async getAlerts(config) {
    const url = "https://opendata-download-warnings.smhi.se/ibww/api/version/1/warning.json";

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error("SMHI API fel:", res.status, res.statusText);
        this.sendSocketNotification("ALERTS_RESULT", []);
        return;
      }

      const data = await res.json();
      const allWarnings = Array.isArray(data) ? data : [];

      console.log("[SMHI-ALERT] Antal hämtade varningar:", allWarnings.length);

      // Plocka ut alla warningAreas och behåll event-info
      const warningAreas = allWarnings.flatMap(w =>
        (w.warningAreas || []).map(wa => ({
          ...wa,
          event: w.event // koppla event-info till varje warningArea
        }))
      );

      // Debuglogg
      warningAreas.forEach((wa, i) => {
        console.log(
          `[SMHI-ALERT DEBUG] #${i + 1}:`,
          wa.eventDescription?.sv || "okänd händelse",
          "| classification:",
          wa.event?.mhoClassification?.code || "okänd"
        );
      });

      // Filtrera på rätt län
      let alerts = warningAreas.filter(wa =>
        (wa.areaName?.sv && wa.areaName.sv.includes(config.area)) ||
        (wa.affectedAreas && wa.affectedAreas.some(aa => aa.sv.includes(config.area)))
      );

      // Filter på classification
      if (config.classificationFilter && Array.isArray(config.classificationFilter)) {
        alerts = alerts.filter(wa => {
          const code = wa.event?.mhoClassification?.code;
          return code && config.classificationFilter.includes(code);
        });
      }

console.log(
  `[SMHI-ALERT] Antal filtrerade varningar för ${config.area} (${config.classificationFilter?.join(", ") || "alla"}):`,
  alerts.length
);
      this.sendSocketNotification("ALERTS_RESULT", alerts);

    } catch (err) {
      console.error("Fel vid hämtning av SMHI Alerts:", err);
      this.sendSocketNotification("ALERTS_RESULT", []);
    }
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_ALERTS") {
      this.getAlerts(payload); // skickar hela payload med area + classificationFilter
    }
  }
});
