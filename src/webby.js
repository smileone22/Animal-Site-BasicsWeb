// webby.js

const net = require('net');
const fs = require('fs');
const path = require('path');

const HTTP_STATUS_CODES= {
    //module-level (global) object
    200:'OK',
    404:'Not Found',
    500:'Internal Server Error'
  };


const MIME_TYPES = {
  //value that will be used in the Content-Type request header
  //jpg jpeg, png, html, css, and txt
  'jpg': 'image/jpeg',
  'jpeg':'image/jpeg',
  'png':'image/png',
  'html':'text/html',
  'css':'text/css',
  'txt':'text/plain'
};

function getExtension(fileName){
    //Extracts the extension of a file name and normalizes it to lowercase. 
    const namesplit= fileName.split('.');
    const c = namesplit.length;
    if (c==1){
        return '';
    }else{
        return namesplit[c-1].toLowerCase();
    }
}

function getMIMEType(fileName) {
    //Based on the extension of the file, give back the associated MIME Type.
    const extension= getExtension(fileName);
    const type= MIME_TYPES[extension];
    if (type!==undefined){
        return type;
    }else{
        return '';
    }
}

class Request {
    //assume that you will always receive a valid http request
    //The Request object represents an http request.
    //take an http request as a string, 
    //parse out information about that request and expose that information as properties (such as method and path).
    constructor (httpRequest){
        const [method, path, ...others]=httpRequest.split(' ');
        this.method= method; 
        this.path=path;
    }
}

class App{
    //An instance of an App represents a web application
    constructor(){
        // use handleConnection as the argument to the net module's createServer so that it's called when a client connects
        //properties 
        // 1 )server - an instance of the net module's Server object; this is the object returned from the net module's createServer, and it's what will be used for accepting connections and listening for data
        this.server = net.createServer(this.handleConnection.bind(this))
        // 2) routes - an object that maps methods and paths to callback functions
        this.routes = {};
        // 3) middlware - a function that gets called before the functions in routes… which enables the user to add features that will be executed before a function from routes is called; it'll be useful for:
        this.middleware =null; 
        // adding logging
        // serving static files (see serveStatic later on in these specifications)
    }
    normalizePath(path){
        //takes a path and normalizes casing and trailing slash. 
        //Additionally, removes the fragment or querystring if present 
        //(does not have to handle both query string and fragment in same path, though).
        let normalized = path.toLowerCase().match(/[a-z]+/g);
        if (normalized ==='' || normalized ==='/' ||normalized==null){
            return '/';
        }
        const res='/'+normalized[0];
        return res; 
    }

    createRouteKey(method, path) {
        //takes a an http method and path, normalizes both, (? both?)
        //and concatenates them in order 
        //to create a key that uniquely identifies a route in the routes object (be the property name)
        const routeKey = method.toUpperCase()+' '+this.normalizePath(path);
        return routeKey; 
    }

    get(path, cb) {
        const rk= this.createRouteKey('GET',path) ////adds GET and path together to create a "key",
        this.routes[rk]=cb; // the callback function, cb (the function to be called when a request matching its key's method and path comes in)
    }

    use(cb) { 
        //sets the middleware property 
        //the callback function will take three arguments
        //Request object, Response object, a next function - representing the next function to call after the middeware is done processing the Request (which basically allows the processing af a Request to optionally continue through the route handling functions in routes)
        this.middleware=cb;
    }

    listen(port, host){
        this.server.listen(port, host);
    }

    handleConnection(sock) {
        //console.log(sock.remoteAddress);
        sock.on('data', (data ) => this.handleRequest(sock,data ) );
    }

    handleRequest(sock, binaryData) {
        const req  =new Request(binaryData+'');  //creating a new Request object (built from binaryData) that represents the incoming request 
        let res = new Response(sock); //creating  a new Response object that represents the potential response
        //calling the middleware function if it's been set (not null)
        if (this.middleware!==null){
            this.middleware (req,res,this.processRoutes(req,res) );
        }
        else { //if there's no middleware function 
            this.processRoutes(req,res); // check if the Request object's method and path matches any of the defined routes in the App object's routes property by calling processRoutes
        }
    }


    processRoutes(req, res) {
        //calls the appropriate function stored in routes to handle the incoming request based on method and path
        const rk= this.createRouteKey(req.method,req.path);
        if (this.routes[rk] ===undefined ){ // if the path and method combination doesn't exist in this
        //|| this.routes.hasOwnProperty(rk)
            //send back a 404 and a plain text response saying Page not found. 
            //create an http response and "send" it to the client
            res.statusCode=404;
            res.send('Page not found.');
        }
        else { //call the function if it's found in routes by passing in the Request and Response objects that were previously passed in to this function as arguments
            this.routes[rk](req,res);
        }
    }

}

class Response {
    constructor (socket, statusCode=200, version="HTTP/1.1"){
        this.sock=socket;
        this.statusCode=statusCode;
        this.version=version;
        this.headers = {};
        this.body='';
    }
    set(name, value) {
        // adds a new header name and header value pair to this Response object's internal headers property
        this.headers[name ]=value ;
    }
    end() {
        // ends the connection by callings the end method on this Response object's internal socket object
        this.sock.end();
    }
    statusLineToString() {
        //returns the the first line of an http response 
        //based on the properties defined in this Response instance (including the trailing newline)
        //ex. HTTP/1.1 200 OK with \r\n at the end
        return this.version+' '+this.statusCode+' '+HTTP_STATUS_CODES[this.statusCode]+'\r\n';
    }
    headersToString() {
        //returns a String representing the headers of this http response (both the name and the value)
        // with each header name/value pair ending with "\r\n"
        let headers_str=''
        for (let header in this.headers){
            headers_str=headers_str+header+': '+this.headers[header]+'\r\n';
        } return headers_str;
    }
    send(body) {
        // sets the body property of this Response object. 
        this.body=body;
        // Sends a valid http response to the client based on this Response object's properties (statusCode, version, and headers) and the body argument

        // if the header doesn't exist in headers
        if (this.headers['Content-Type']===undefined){
            this.headers['Content-Type']= 'text/html';
        }
        this.sock.write(this.statusLineToString());
        this.sock.write(this.headersToString() +'\r\n' );
        // above status line and headers to the socket first 

        this.sock.write(this.body);
        this.end(); // and closes the connection. (no return value)
    }
    status(statusCode) { 
        this.statusCode=statusCode; //sets the statusCode, 
        return this;  //and returns the Response object that it was called on (essentially return this) to support method chaining
    }
}





function serveStatic(basePath){
    function f (req,res,next){
        //construct a path on the file system to attempt to read the file 
        //by using the path module and path.join (see the example code) on the basePath and the path from the Request object, req.path;
        let fsp = path.join(basePath,req.path); //file system p
        fs.readFile(fsp, (err,data) => {
            if (err){
                //next(); 
            }
            else{
                res.set('Content-Type',getMIMEType(req.path)); //set the correct status and the right Content-Type in your response
                console.log(res.headers['Content-Type']);
                res.status(200);
                res.send(data);
            }
        });



    }
    return f; 
}


module.exports = {
    HTTP_STATUS_CODES: HTTP_STATUS_CODES,
    MIME_TYPES: MIME_TYPES,
    getExtension: getExtension,
    getMIMEType: getMIMEType,
    Request: Request,
    Response: Response,
    App: App,
    static: serveStatic //export serveStatic as static
};