# Jellyfish Chat Widget

The chat widget is an embeddable component to allow external clients to send
and receive messages using the Jellyfish system.

# Usage

Below is an example how to use this library:

```js
import {
	App
} from '@balena/jellyfish-chat-widget'

...
return (
	<Container>
		<App
			sdk={sdk}
			productTitle={'Jelly'}
			product={'jellyfish'}
			onClose={onClose}
		/>
	</Container>
)
```

# Documentation

[![Publish Documentation](https://github.com/product-os/jellyfish-chat-widget/actions/workflows/publish-docs.yml/badge.svg)](https://github.com/product-os/jellyfish-chat-widget/actions/workflows/publish-docs.yml)

Visit the website for complete documentation: https://product-os.github.io/jellyfish-chat-widget
