const _MS_PER_MINUTE = 1000 * 60;

function roundToPlace(n, p) {
    var multiplier = Math.pow(10, p);
    return Math.round(n * multiplier) / multiplier;
}

fetch('/index.md')
  .then(response => {
    /*
    // Get the value of the 'Content-Type' header
    const contentType = response.headers.get('Content-Type');
    console.log('Content-Type:', contentType);

    // Get all the headers as a Headers object
    const allHeaders = response.headers;
    console.log('All headers:', allHeaders);

    // Convert the Headers object to a plain JavaScript object
    const headersObject = Object.fromEntries(allHeaders.entries());
    console.log('Headers as an object:', headersObject);

    // Access other properties of the response object
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    */
    server = new Date(response.headers.get('Date'));
    client = new Date();
    var message = "<pre>Server:\n" +
        server.toUTCString() + "\n" +
        "Client:\n" +
        client.toUTCString() + "\n" +
        "Difference:\n" +
        roundToPlace((client - server) / _MS_PER_MINUTE, 2) + " minutes" +
        "</pre>";
    document.getElementById("date").innerHTML = message;
    console.log(response.text());
  })
  .catch(error => console.error('Error:', error));
