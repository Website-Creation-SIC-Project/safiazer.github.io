import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		name: 'world',
		FOOTER_DATA: {
			DESCRIPTION:
			  "We are typically focused on result-based maketing in the digital world. Also, we evaluate your brand’s needs and develop a powerful strategy that maximizes profits.",
			CONTACT_DETAILS: {
			  HEADING: "Contact us",
			  ADDRESS: "La trobe street docklands, Melbourne",
			  MOBILE: "+1 61234567890",
			  EMAIL: "nixalar@gmail.com"
			},
			SUBSCRIBE_NEWSLETTER: "Subscribe newsletter",
			SUBSCRIBE: "Subscribe"
		  },
		  HEADER:  "Nixalar"
	}
});

export default app;