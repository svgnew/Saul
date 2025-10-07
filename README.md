# Saul - SVG Generator Agent

A command-line tool that generates SVG images from natural language descriptions using Claude AI.

## Demo


## Usage

To get started run the tool using npx:

```
npx svgnew-saul
```


### Interactive Mode

Simply run:
```bash
npx svgnew-saul
```

You'll be prompted to:
1. Enter a description of the image you want to create
2. After generation, choose to:
   - **View SVG** - Opens the SVG in your default browser
   - **Modify SVG** - Enter a prompt to adjust the image
   - **Auto adjust** - Let AI improve the image
   - **Create new** - Generate a completely new image
   - **Exit** - Quit the application

### Piped Mode

You can also pipe descriptions directly:
```bash
echo "a red house with a blue roof" | npm start
```

In piped mode, the tool will output the paths to the generated files and exit.

## Examples

**Interactive:**
```bash
npm start
# Enter: "a minimalist mountain landscape at sunset"
```

**Piped:**
```bash
echo "a geometric logo with triangles" | npm start
```

## Development

### Setup

```bash
npm install
```

1. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

2. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=your_actual_api_key_here
```

Get your API key from: https://console.anthropic.com/


### Requirements

- Node.js 18+
- An Anthropic API key

## License

MIT
