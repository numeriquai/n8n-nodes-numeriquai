# n8n-nodes-process-application

A custom n8n community node for processing application data by sending it to a backend API with authentication.

## Features

- Send POST requests to a configurable API endpoint
- Include guideline ID and flexible JSON input data
- Bearer token authentication
- Error handling with continue on fail option
- Configurable API endpoint URL

## Installation

### For n8n Cloud or Self-hosted n8n

1. Go to your n8n instance
2. Navigate to Settings > Community Nodes
3. Click "Install a community node"
4. Enter the package name: `n8n-nodes-process-application`
5. Click "Install"

### For Local Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the node:
   ```bash
   npm run build
   ```
4. Link the node to n8n:
   ```bash
   npm link
   cd ~/.n8n/nodes
   npm link n8n-nodes-process-application
   ```

## Usage

### Node Parameters

- **Guideline ID** (required): The unique identifier for the guideline to process
- **Input Data** (required): JSON object containing the data to send to the API
- **Authentication Token** (required): Bearer token for API authentication
- **API Endpoint** (required): The URL endpoint to send the request to (default: `http://localhost:8000/api/v1/audits`)

### Example Workflow

1. Add the "Process Application" node to your workflow
2. Configure the parameters:
   - Guideline ID: `"guideline-123"`
   - Input Data: 
     ```json
     {
       "applicantName": "John Doe",
       "applicationType": "standard",
       "priority": "high"
     }
     ```
   - Authentication Token: `"your-bearer-token-here"`
   - API Endpoint: `"http://localhost:8000/api/v1/audits"`

3. The node will send a POST request with the following structure:
   ```json
   {
     "guidelineId": "guideline-123",
     "applicantName": "John Doe",
     "applicationType": "standard",
     "priority": "high"
   }
   ```

4. The response from the API will be returned as JSON output

### API Request Format

The node sends a POST request with:
- **URL**: Configurable endpoint (default: `http://localhost:8000/api/v1/audits`)
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**: JSON object containing `guidelineId` merged with the input data

### Error Handling

- If the API request fails, the node will throw an error by default
- Enable "Continue on Fail" in the node settings to return error information instead of stopping the workflow
- Validation errors for missing required parameters will always stop execution

## Development

### Prerequisites

- Node.js (version 18.17.0 or higher)
- npm
- n8n instance for testing

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Testing

1. Build the node: `npm run build`
2. Link to n8n: `npm link`
3. Start n8n: `n8n start`
4. The node will be available in the n8n editor

## Publishing

To publish this node to the npm registry:

1. Update the version in `package.json`
2. Build the project: `npm run build`
3. Run linting: `npm run lint`
4. Publish: `npm publish`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT

## Support

For issues and questions:
- Create an issue on GitHub
- Check the n8n community documentation
- Join the n8n community Discord
