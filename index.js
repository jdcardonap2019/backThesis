const express = require('express');
const {auth, resolver, loaders, protocol, circuits} = require('@iden3/js-iden3-auth')
const getRawBody = require('raw-body')

const app = express();
const port = 8080;
const cors = require('cors');
const originsAllowed = ['http://localhost:4200'];
app.use(cors({origin: originsAllowed}));
app.use(express.static('static'));

app.get("/api/sign-in", (req, res) => {
    console.log('get Auth Request');
    GetAuthRequest(req,res);
	console.log('Finished Auth Request')
});

app.post("/api/callback", (req, res) => {
    console.log('callback');
    Callback(req,res);
});

app.listen(port, () => {
    console.log('server running on port 8080');
});


// Create a map to store the auth requests and their session IDs
const requestMap = new Map();

// GetQR returns auth request
async function GetAuthRequest(req,res) {
	console.log('Enter in AuthRequestMethod');

	// Audience is verifier id
	const hostUrl = "https://33dc-186-84-135-86.ngrok.io";
	const sessionId = 1;
	const callbackURL = "/api/callback"
	const audience = "117fsb3hktLw8ie9E6Qj9kfgRHXhLxq9XYaedsJdGU"

	const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;

	// Generate request for basic authentication
	const request = auth.createAuthorizationRequestWithMessage(
		'test flow',
		'message to sign',
		audience,
		uri,
	);

	console.log('Request created');
	
	request.id = '7f38a193-0918-4a48-9fac-36adfdb8b542';
	request.thid = '7f38a193-0918-4a48-9fac-36adfdb8b542';

	// Add request for a specific proof
	//Credit card ID Cuenta
	/*const proofRequest = {
		id: 1, // request id
		circuit_id: 'credentialAtomicQuerySig',
		rules: {
		  query: {
			allowedIssuers: ['*'], // ID of the trusted issuers
			schema: {
			  type: 'CuentaAhorrosBancolombia',
			  url: 'https://platform-test.polygonid.com/claim-link/7721dfb0-b142-4e52-a1b9-24d7f994a185',
			},
			req: {
			  IDCuenta: {
				$lt: 999999999999999999, 
			  },
			},
		  },
		},
	  };
	console.log('ProofRequest created');
	const scope = request.body.scope ?? [];
	request.body.scope = [...scope, proofRequest];*/

	//Credit card Saldo
	const proofRequest = {
		id: 1, // request id
		circuit_id: 'credentialAtomicQuerySig',
		rules: {
		  query: {
			allowedIssuers: ['*'], // ID of the trusted issuers
			schema: {
			  type: 'CuentaAhorrosBancolombia',
			  url: 'https://s3.eu-west-1.amazonaws.com/polygonid-schemas/293f43bf-bc85-4bfd-991c-ec9e8299a4aa.json-ld',
			},
			req: {
			  Saldo: {
				$gt: 50000000, 
			  },
			},
		  },
		},
	  };
	console.log('ProofRequest created');
	const scope = request.body.scope ?? [];
	request.body.scope = [...scope, proofRequest];


	/*const proofRequest  = {
		id: 1, // request id
		circuit_id: 'credentialAtomicQuerySig',
		rules: {
			query: {
			allowedIssuers: ['*'], // ID of the trusted issuer
			schema: {
				type: 'PolygonDAOMember',
				url: 'https://schema.polygonid.com/jsonld/dao.json-ld',
			}
			},
			req: {
				role: {
				  $eq: 1, // the role must be 1
				},
			  },
		},
		};
	
	console.log('ProofRequest created');
	const scope = request.body.scope ?? [];
	request.body.scope = [...scope, proofRequest];*/

	//Credit card
	/*const proofRequest = {
		id: 1, // request id
		circuit_id: 'credentialAtomicQuerySig',
		rules: {
			query: {
			allowedIssuers: ['*'],
			schema: {
				type: 'EmployeeData',
				url: 'https://schema.com/...employeedata',
			},
			req: {
				monthlySalary: {
				$gt: 1000, // monthlySalary must be over $1000
				},
			},
			},
		},
		};
	const scope = request.body.scope ?? [];
	request.body.scope = [...scope, proofRequest];*/

	
	// Store auth request in map associated with session ID
	requestMap.set(`${sessionId}`, request);
	console.log(res);
	console.log(request);

	return res.status(200).set('Content-Type', 'application/json').send(request);
}

// Callback verifies the proof after sign-in callbacks
async function Callback(req,res) {

	// Get session ID from request
	const sessionId = req.query.sessionId;

	// get JWZ token params from the post request
	const raw = await getRawBody(req);
	const tokenStr = raw.toString().trim();

	// fetch authRequest from sessionID
	const authRequest = requestMap.get(`${sessionId}`);
		
	// Locate the directory that contains circuit's verification keys
	const verificationKeyloader = new loaders.FSKeyLoader('./keys');
	const sLoader = new loaders.UniversalSchemaLoader('ipfs.io');

	console.log('Done');

	// Add Polygon Mumbai RPC node endpoint - needed to read on-chain state and identity state contract address
	const ethStateResolver = new resolver.EthStateResolver('https://polygon-mumbai.g.alchemy.com/v2/NEJA3Eag1uULw6Gdq7b6f2Fe9Nk5G_mE', '0x46Fd04eEa588a3EA7e9F055dd691C688c4148ab3');

	console.log('Done ethStateResolver');
	console.log(ethStateResolver);

	// EXECUTE VERIFICATION
	const verifier = new auth.Verifier(
	verificationKeyloader,
	sLoader, ethStateResolver
);


try {
	authResponse = await verifier.fullVerify(tokenStr, authRequest);
	console.log('Done FullVerify');
} catch (error) {
	console.log(error);
	console.log('Error 500');
	return res.status(500).send(error);
	}
return res.status(200).set('Content-Type', 'application/json').send("user with ID: " + authResponse.from + " Succesfully authenticated");
}
