let socket;
let requests = [];

Hooks.once("init", () => {
  game.settings.register("table-safety", "viewedHint", {
    name: "Table Safety - Hint Viewed",
    hint: "Whether the user has viewed the hint dialog before.",
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register("table-safety", "version", {
    name: "Table Safety - Module Version",
    hint: "The current version of the Table Safety module.",
    scope: "client",
    config: false,
    type: String,
    default: "1.0.0"
  });

  game.settings.register("table-safety", "enablePause", {
    name: "Enable Pause Requests",
    hint: "Allow players to request pauses during the game.",
    scope: "world",
    config: true,
    type: Boolean,
    requiresReload: true,
    default: true
  });

  game.settings.register("table-safety", "enableFastForward", {
    name: "Enable Fast-Forward Requests",
    hint: "Allow players to request fast-forwards during the game.",
    scope: "world",
    config: true,
    type: Boolean,
    requiresReload: true,
    default: true
  });

  game.settings.register("table-safety", "enableHardstop", {
    name: "Enable Hard-Stop Requests",
    hint: "Allow players to request hard-stops during the game.",
    scope: "world",
    config: true,
    type: Boolean,
    requiresReload: true,
    default: true
  });

  game.settings.register("table-safety", "enableHands", {
    name: "Enable Speak Requests",
    hint: "Allow players to request speaking opportunities during the game.",
    scope: "world",
    config: true,
    type: Boolean,
    requiresReload: true,
    default: true
  });

  const installedVersion = game.modules.find(m => m.id === "table-safety").version;
  const savedVersion = game.settings.get("table-safety", "version");
  
  if (installedVersion !== savedVersion) {
    console.log(`Table Safety | Updating module settings version from ${savedVersion} to ${installedVersion}`);
    game.settings.set("table-safety", "version", installedVersion);
    game.settings.set("table-safety", "viewedHint", false);
  }
});

Hooks.once("ready", () => {
  if (!game.settings.get("table-safety", "viewedHint")) {
    new foundry.applications.api.DialogV2({
      window: { title: "Table Safety - Hint" },
      content: `
        <h2 style="margin-bottom: 0; padding-bottom: 0;">${game.i18n.localize("TableSafety.HINT.Title")}</h2>
        <hr style="margin-top: 0; padding-top: 0;"/>
        <p style="width: 80ch;">${game.i18n.localize("TableSafety.HINT.Paragraph1")}</p>
        <div style="display: flex; flex-direction: row; gap: 10px; align-items: center; margin-top: 10px; margin-bottom: 10px;">
          <img src="modules/table-safety/v13-buttons.png" style="width: 40ch; margin-top: 10px; margin-bottom: 10px;" alt="Player buttons" />
          <video autoplay style="width: 40ch; margin-top: 10px; margin-bottom: 10px;" muted loop> 
            <source src="modules/table-safety/v13-gm-button-highlight.webm" type="video/webm">
            Your browser does not support the video tag.
          </video>
        </div>
        <div style="display: flex; flex-direction: row; gap: 10px; justify-content: space-around; align-items: center; margin-top: 10px; margin-bottom: 10px;">
          <img src="modules/table-safety/v13-sidebar-buttons.png" style="height: 200px; object-fit: scale-down; margin-top: 10px; margin-bottom: 10px;" alt="Player sidebar buttons" />
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <p style="width: 60ch;">${game.i18n.localize("TableSafety.HINT.Paragraph2")}</p>
            <p style="width: 60ch;">${game.i18n.localize("TableSafety.HINT.Paragraph3")}</p>
          </div>
          <img src="modules/table-safety/v13-gm-sidebar-buttons.png" style="height: 200px; object-fit: scale-down; margin-top: 10px; margin-bottom: 10px;" alt="Player sidebar buttons" />
        </div>
        <p>${game.i18n.localize("TableSafety.HINT.Footer")}</p>
      `,
      buttons: [{
        action: "ok",
        label: "Got it!",
        default: true,
        callback: (event, button, dialog) => dialog.close()
      }],
      submit: result => {
        game.settings.set("table-safety", "viewedHint", true);
        return;
      }
    }).render({ force: true });
  }
});

Hooks.once("socketlib.ready", () => {
	socket = socketlib.registerModule("table-safety");
  
  // Ack
  socket.register("ack", gmAcknowledgement);
	
  // Pause
  socket.register("pause", tableSafetyPauseRequest);

  // Fastforward
  socket.register("fastforward", tableSafetyFastforwardRequest);

  // Hardstop
  socket.register("hardstop", tableSafetyHardstopRequest);

  // Hands
  socket.register("hands", tableSafetyHandsRequest);
  socket.register("handsNotify", tableSafetyHandsNotifyAll);

  console.log(socket);
});

function highlightAcknowledge() {
  document.querySelector(".table-safety-acknowledge").classList.add("active");
}

function tableSafetyPauseRequest(userId) {
  highlightAcknowledge();
  ui.notifications.warn(game.i18n.localize("TableSafety.MESSAGES.PauseRequest"), { permanent: true });
  requests.push({
    type: "pause",
    user: userId,
    time: Date.now()
  })
}

function tableSafetyHardstopRequest(userId) {
  highlightAcknowledge();
  ui.notifications.warn(game.i18n.localize("TableSafety.MESSAGES.HardstopRequest"), { permanent: true });
  requests.push({
    type: "hardstop",
    user: userId,
    time: Date.now()
  })
}

function tableSafetyFastforwardRequest(userId) {
  highlightAcknowledge();
  const username = game.users.get(userId).name;
  ui.notifications.warn(game.i18n.localize("TableSafety.MESSAGES.FastForwardRequest"), { permanent: true });
  requests.push({
    type: "fastforward",
    user: userId,
    time: Date.now()
  })
}

function tableSafetyHandsRequest(userId) {
  highlightAcknowledge();
  const username = game.users.get(userId).name;
  ui.notifications.warn(game.i18n.format("TableSafety.MESSAGES.SpeakRequest", { username }), { permanent: true });
  requests.push({
    type: "hands",
    user: userId,
    time: Date.now()
  })
}

function tableSafetyHandsNotifyAll() {
  if (!game.user.isGM) 
    ui.notifications.warn(game.i18n.localize("TableSafety.MESSAGES.SpeakNotification"));
}

async function gmAcknowledgement(userId) {
  new foundry.applications.api.DialogV2({
    window: { title: "Acknowledgement" },
    content: game.i18n.localize("TableSafety.MESSAGES.Acknowledged"),
    buttons: [{
      action: "ok",
      label: "Confirm",
      default: true,
      callback: (event, button, dialog) => dialog.close()
    }],
    submit: result => {
      return;
    }
  }).render({ force: true });
}

Hooks.on("renderSidebarTab", (tab) => {
  if (game.version.major > 12) return; // Only run for v12 and below

  if (tab.title !== "Chat Log") return;

  const pauseButton = document.createElement('button');
  const pauseButtonIcon = document.createElement('i');
  pauseButtonIcon.classList.add("fa-solid", "fa-pause");
  pauseButton.appendChild(pauseButtonIcon);
  pauseButton.type = "button";
  pauseButton.classList.add("table-safety-button")
  pauseButton.onclick = (event) => {
    socket.executeForAllGMs("pause", game.user._id);
  };
  
  const hardstopButton = document.createElement('button');
  const hardstopButtonIcon = document.createElement('i');
  hardstopButtonIcon.classList.add("fa-solid", "fa-shield-xmark");
  hardstopButton.appendChild(hardstopButtonIcon);
  hardstopButton.type = "button";
  hardstopButton.classList.add("table-safety-button")
  hardstopButton.onclick = (event) => {
    socket.executeForAllGMs("hardstop", game.user._id);
  };

  const fastforwardButton = document.createElement('button');
  const fastforwardButtonIcon = document.createElement('i');
  fastforwardButtonIcon.classList.add("fa-solid", "fa-forward");
  fastforwardButton.appendChild(fastforwardButtonIcon);
  fastforwardButton.type = "button";
  fastforwardButton.classList.add("table-safety-button")
  fastforwardButton.onclick = async (event) => {
    await socket.executeForAllGMs("fastforward", game.user._id);
  };

  const handsButton = document.createElement('button');
  const handsButtonIcon = document.createElement('i');
  handsButtonIcon.classList.add("fa-solid", "fa-hand");
  handsButton.appendChild(handsButtonIcon);
  handsButton.type = "button";
  handsButton.classList.add("table-safety-button")
  handsButton.onclick = async (event) => {
    await socket.executeForOthers("handsNotify");
    await socket.executeForAllGMs("hands", game.user._id);
  };

  const acknowledgeButton = document.createElement('button');
  const acknowledgeButtonIcon = document.createElement('i');
  acknowledgeButtonIcon.classList.add("fa-solid", "fa-thumbs-up");
  acknowledgeButton.appendChild(acknowledgeButtonIcon);
  acknowledgeButton.type = "button";
  acknowledgeButton.classList.add("table-safety-button", "table-safety-acknowledge")
  acknowledgeButton.onclick = (event) => {
    requests.forEach(r => {
      if (r.type === "pause") game.togglePause(true, true);
      socket.executeAsUser("ack", r.user);
    });
    requests = [];
    acknowledgeButton.classList.remove("active");
  };

  const enablePause = game.settings.get("table-safety", "enablePause");
  const enableFastForward = game.settings.get("table-safety", "enableFastForward");
  const enableHardstop = game.settings.get("table-safety", "enableHardstop");
  const enableHands = game.settings.get("table-safety", "enableHands");
  
  const control = document.createElement('div');
  if (!game.user.isGM && enablePause) control.appendChild(pauseButton);
  if (!game.user.isGM && enableHardstop) control.appendChild(hardstopButton);
  if (!game.user.isGM && enableHands) control.appendChild(handsButton);
  if (!game.user.isGM && enableFastForward) control.appendChild(fastforwardButton);
  if (game.user.isGM) control.appendChild(acknowledgeButton);
  control.classList.add("table-safety");

  //const nodes = Array.from(tab.element[0].childNodes);
  //const before = nodes.filter(f => f.id === "chat-controls");
  const before = tab.element[0].childNodes[5];

  tab.element[0].insertBefore(control, before);
});

Hooks.once("renderChatInput", (app, elements, context) => {
  if (game.release.generation < 13) return; // Only run for v13 and above

  console.log("Table Safety => ", app, elements, context);

  const pauseButton = document.createElement('button');
  const pauseButtonIcon = document.createElement('i');
  pauseButtonIcon.classList.add("fa-solid", "fa-pause");
  pauseButton.appendChild(pauseButtonIcon);
  pauseButton.type = "button";
  pauseButton.classList.add("ui-control", "icon", "table-safety-button");
  pauseButton.dataset.tooltip = game.i18n.localize("TableSafety.TOOLTIPS.PauseTooltip");
  pauseButton.onclick = (event) => {
    foundry.ui.notifications.info(game.i18n.localize("TableSafety.MESSAGES.RequestSent"));
    socket.executeForAllGMs("pause", game.user._id);
  };
  
  const hardstopButton = document.createElement('button');
  const hardstopButtonIcon = document.createElement('i');
  hardstopButtonIcon.classList.add("fa-solid", "fa-shield-xmark");
  hardstopButton.appendChild(hardstopButtonIcon);
  hardstopButton.type = "button";
  hardstopButton.classList.add("ui-control", "icon", "table-safety-button")
  hardstopButton.dataset.tooltip = game.i18n.localize("TableSafety.TOOLTIPS.HardstopTooltip");
  hardstopButton.onclick = (event) => {
    foundry.ui.notifications.info(game.i18n.localize("TableSafety.MESSAGES.RequestSent"));
    socket.executeForAllGMs("hardstop", game.user._id);
  };

  const fastforwardButton = document.createElement('button');
  const fastforwardButtonIcon = document.createElement('i');
  fastforwardButtonIcon.classList.add("fa-solid", "fa-forward");
  fastforwardButton.appendChild(fastforwardButtonIcon);
  fastforwardButton.type = "button";
  fastforwardButton.classList.add("ui-control", "icon", "table-safety-button")
  fastforwardButton.dataset.tooltip = game.i18n.localize("TableSafety.TOOLTIPS.FastForwardTooltip");
  fastforwardButton.onclick = async (event) => {
    foundry.ui.notifications.info(game.i18n.localize("TableSafety.MESSAGES.RequestSent"));
    await socket.executeForAllGMs("fastforward", game.user._id);
  };

  const handsButton = document.createElement('button');
  const handsButtonIcon = document.createElement('i');
  handsButtonIcon.classList.add("fa-solid", "fa-hand");
  handsButton.appendChild(handsButtonIcon);
  handsButton.type = "button";
  handsButton.classList.add("ui-control", "icon", "table-safety-button")
  handsButton.dataset.tooltip = game.i18n.localize("TableSafety.TOOLTIPS.SpeakTooltip");
  handsButton.onclick = async (event) => {
    foundry.ui.notifications.info(game.i18n.localize("TableSafety.MESSAGES.RequestSent"));
    await socket.executeForOthers("handsNotify");
    await socket.executeForAllGMs("hands", game.user._id);
  };

  const acknowledgeButton = document.createElement('button');
  const acknowledgeButtonIcon = document.createElement('i');
  acknowledgeButtonIcon.classList.add("fa-solid", "fa-thumbs-up");
  acknowledgeButton.appendChild(acknowledgeButtonIcon);
  acknowledgeButton.type = "button";
  acknowledgeButton.classList.add("ui-control", "icon", "table-safety-button", "table-safety-acknowledge")
  acknowledgeButton.dataset.tooltip = game.i18n.localize("TableSafety.TOOLTIPS.AcknowledgeTooltip");
  acknowledgeButton.onclick = (event) => {
    requests.forEach(r => {
      if (r.type === "pause") game.togglePause(true, true);
      socket.executeAsUser("ack", r.user);
    });
    requests = [];
    acknowledgeButton.classList.remove("active");
  };

  const enablePause = game.settings.get("table-safety", "enablePause");
  const enableFastForward = game.settings.get("table-safety", "enableFastForward");
  const enableHardstop = game.settings.get("table-safety", "enableHardstop");
  const enableHands = game.settings.get("table-safety", "enableHands");

  const control = document.createElement('div');
  if (!game.user.isGM && enablePause) control.appendChild(pauseButton);
  if (!game.user.isGM && enableHardstop) control.appendChild(hardstopButton);
  if (!game.user.isGM && enableHands) control.appendChild(handsButton);
  if (!game.user.isGM && enableFastForward) control.appendChild(fastforwardButton);
  if (game.user.isGM) control.appendChild(acknowledgeButton);
  control.classList.add("table-safety");

  const spacer = document.createElement("div");
  spacer.style.width = "5px";
  spacer.style.height = "5px";

  //context.previousParent.appendChild(control);

  if (context.previousParent.querySelector('#roll-privacy')) {
    context.previousParent.querySelector("#roll-privacy").appendChild(spacer);
    context.previousParent.querySelector("#roll-privacy").appendChild(control);
  } else {
    app.element.querySelector("#roll-privacy").appendChild(spacer);
    app.element.querySelector("#roll-privacy").appendChild(control);
  }
  
  const chatScroll = app.element.querySelector(".chat-scroll");
  chatScroll.style.height = chatScroll.style.height - "30px";
  //app.element.querySelector("#roll-privacy").appendChild(control);
})