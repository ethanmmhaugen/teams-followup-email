// File: src/utils/loadOfficeJs.ts

export const loadOfficeJs = (callback: () => void) => {
	// Office.js is already loaded in Outlook clients
	if (typeof Office !== "undefined" && Office.context) {
		callback();
		return;
	}

	// Dynamically load Office.js if it's not already present
	const scriptId = "office-js";

	if (!document.getElementById(scriptId)) {
		const script = document.createElement("script");
		script.id = scriptId;
		script.type = "text/javascript";
		script.src = "https://appsforoffice.microsoft.com/lib/1/hosted/office.js";
		script.onload = () => {
			// Wait for Office to be initialized
			Office.onReady(() => callback());
		};
		document.head.appendChild(script);
	} else {
		// If already loaded, just wait for Office to be ready
		Office.onReady(() => callback());
	}
};
