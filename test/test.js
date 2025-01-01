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
    document.write("<pre>\n");
    document.write("Server\n");
    document.write(response.headers.get('Date'));
    document.write("\nClient\n");
    document.write(new Date().toUTCString());
    document.write("</pre>");
  })
  .catch(error => console.error('Error:', error));
