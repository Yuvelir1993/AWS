function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri === "/projects") {
    request.uri = "/projects/index.html";
    console.log("Request uri '/projects' has been modified to " + request.uri);
  }
  return request;
}
