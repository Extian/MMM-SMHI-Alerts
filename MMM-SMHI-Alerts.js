/* global Module */

Module.register("MMM-SMHI-Alerts", {
  defaults: {
    area: "Västra Götalands län",
    updateInterval: 10 * 60 * 1000, // hämta från API var 10:e minut
    rotateInterval: 30 * 1000,      // byt varning var 30:e sekund
    animationSpeed: 1000,
    classificationFilter: []        // tom = alla, annars t.ex. ["MET"]
  },

  start: function () {
    this.alerts = [];
    this.activeIndex = 0;
    this.getAlerts();

    setInterval(() => {
      this.getAlerts();
    }, this.config.updateInterval);

    setInterval(() => {
      if (this.alerts.length > 0) {
        this.activeIndex = (this.activeIndex + 1) % this.alerts.length;
        this.updateDom(this.config.animationSpeed);
      }
    }, this.config.rotateInterval);
  },

  // Skicka både area och classificationFilter till helpern
  getAlerts: function () {
    this.sendSocketNotification("GET_ALERTS", {
      area: this.config.area,
      classificationFilter: this.config.classificationFilter
    });
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "ALERTS_RESULT") {
      this.alerts = payload;
      this.activeIndex = 0; // börja om från första
      this.updateDom(this.config.animationSpeed);
    }
  },

  getStyles: function () {
    return ["MMM-SMHI-Alerts.css"];
  },

  getDom: function () {
    const wrapper = document.createElement("div");

    if (!this.alerts || this.alerts.length === 0) {
      wrapper.innerHTML = "Inga varningar just nu";
      wrapper.className = "dimmed small";
      return wrapper;
    }

    const alert = this.alerts[this.activeIndex];

    let levelClass = "yellow";
    if (alert.warningLevel?.code === "ORANGE") levelClass = "orange";
    if (alert.warningLevel?.code === "RED") levelClass = "red";

    const div = document.createElement("div");
    div.className = `smhi-alert ${levelClass}`;

    div.innerHTML = `
      <strong>${alert.eventDescription?.sv}</strong> (${alert.warningLevel?.sv})<br>
      <span class="dimmed small">${alert.areaName?.sv}</span>
    `;

    wrapper.appendChild(div);
    return wrapper;
  }
});
