const socket = io();

// Elements
const $messageForm = document.querySelector("form");
const $messageFormInput = document.querySelector("input");
const $messageFormButton = document.querySelector("#send");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// Templates
const $messageTemplate = document.querySelector("#message-template").innerHTML;
const $locationTemplate = document.querySelector("#location-template")
  .innerHTML;
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  //Height of the new message
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // visble height
  const visibleHeight = $messages.offsetHeight;

  // height of messages container
  const contentHeight = $messages.scrollHeight;

  // How far have I scrolled ?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (contentHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

$messageForm.addEventListener("submit", e => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");
  socket.emit("sendMessage", e.target.elements.message.value, error => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
  });
});

function locationGot(location) {
  $sendLocationButton.removeAttribute("disabled");
  socket.emit("sendLocation", {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude
  });
}

$sendLocationButton.addEventListener("click", e => {
  // some browser does not support geolocation
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  $sendLocationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition(locationGot);
});

socket.on("message", message => {
  const html = Mustache.render($messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", location => {
  const html = Mustache.render($locationTemplate, {
    username: location.username,
    location: location.url,
    createdAt: moment(location.createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render($sidebarTemplate, { room, users });
  $sidebar.innerHTML = html;
});
