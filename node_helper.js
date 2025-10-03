/* MagicMirror²
 * Module: MMM-SMHI-Alerts
 */

const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-SMHI-Alerts helper started...");
  },

  async getAlerts(area) {
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

      // Plocka ut alla warningAreas
      const warningAreas = allWarnings.flatMap(w => w.warningAreas || []);

      // Logga för debug
//      warningAreas.forEach((wa, i) => {
//        console.log(
//          `[SMHI-ALERT] ${i + 1}:`,
//          wa.eventDescription?.sv || "okänd händelse",
//          "| Nivå:", wa.warningLevel?.sv || "okänd",
//          "| Område:", wa.areaName?.sv || "okänt",
//          "| Län:", (wa.affectedAreas || []).map(a => a.sv).join(", ")
//        );
//      });

      // Filtrera på rätt län
      const alerts = warningAreas.filter(wa =>
        (wa.areaName?.sv && wa.areaName.sv.includes(area)) ||
        (wa.affectedAreas && wa.affectedAreas.some(aa => aa.sv.includes(area)))
      );

//      console.log("[SMHI-ALERT] Antal filtrerade varningar för", area, ":", alerts.length);

      this.sendSocketNotification("ALERTS_RESULT", alerts);

    } catch (err) {
      console.error("Fel vid hämtning av SMHI Alerts:", err);
      this.sendSocketNotification("ALERTS_RESULT", []);
    }
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_ALERTS") {
      this.getAlerts(payload.area);
    }
  }
});
