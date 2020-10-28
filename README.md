# Jellyfish Chat Widget

The chat widget is an embeddable component to allow external clients to send
and receive messages using Jellyfish.

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
