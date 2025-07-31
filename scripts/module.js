let socket;
let requests = [];

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
  ui.notifications.warn("TABLE SAFETY - A player has requested a game pause.", { permanent: true });
  requests.push({
    type: "pause",
    user: userId,
    time: Date.now()
  })
}

function tableSafetyHardstopRequest(userId) {
  highlightAcknowledge();
  ui.notifications.warn("TABLE SAFETY - A player has requested a scene and/or situation hardstop.", { permanent: true });
  requests.push({
    type: "hardstop",
    user: userId,
    time: Date.now()
  })
}

function tableSafetyFastforwardRequest(userId) {
  highlightAcknowledge();
  const username = game.users.get(userId).name;
  ui.notifications.warn(`TABLE SAFETY - A player would like to fast-forward through this scene and/or situation.`, { permanent: true });
  requests.push({
    type: "fastforward",
    user: userId,
    time: Date.now()
  })
}

function tableSafetyHandsRequest(userId) {
  highlightAcknowledge();
  const username = game.users.get(userId).name;
  ui.notifications.warn(`TABLE SAFETY - ${username} would like a chance to speak.`, { permanent: true });
  requests.push({
    type: "hands",
    user: userId,
    time: Date.now()
  })
}

function tableSafetyHandsNotifyAll() {
  if (!game.user.isGM) 
    ui.notifications.warn(`TABLE SAFETY - Another player would like the chance to speak.`);
}

async function gmAcknowledgement(userId) {
  new foundry.applications.api.DialogV2({
    window: { title: "Acknowledgement" },
    content: `The GM recieved and acknowledged your request`,
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

  const control = document.createElement('div');
  if (!game.user.isGM) control.appendChild(pauseButton);
  if (!game.user.isGM) control.appendChild(hardstopButton);
  if (!game.user.isGM) control.appendChild(handsButton);
  if (!game.user.isGM) control.appendChild(fastforwardButton);
  if (game.user.isGM) control.appendChild(acknowledgeButton);
  control.classList.add("table-safety");

  //const nodes = Array.from(tab.element[0].childNodes);
  //const before = nodes.filter(f => f.id === "chat-controls");
  const before = tab.element[0].childNodes[5];

  tab.element[0].insertBefore(control, before);
});

Hooks.once("renderChatInput", (app, elements, context) => {
  if (game.release.generation < 13) return; // Only run for v13 and above

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

  const control = document.createElement('div');
  if (!game.user.isGM) control.appendChild(pauseButton);
  if (!game.user.isGM) control.appendChild(hardstopButton);
  if (!game.user.isGM) control.appendChild(handsButton);
  if (!game.user.isGM) control.appendChild(fastforwardButton);
  if (game.user.isGM) control.appendChild(acknowledgeButton);
  control.classList.add("table-safety");

  const spacer = document.createElement("div");
  spacer.style.width = "5px";
  spacer.style.height = "5px";

  //context.previousParent.appendChild(control);
  context.previousParent.querySelector("#roll-privacy").appendChild(spacer);
  context.previousParent.querySelector("#roll-privacy").appendChild(control);
  const chatScroll = app.element.querySelector(".chat-scroll");
  chatScroll.style.height = chatScroll.style.height - "30px";
  //app.element.querySelector("#roll-privacy").appendChild(control);
})