export const LoginToast = () => (
	<div className="bg-primary-accent text-white px-4 py-2 rounded-md">
		<button onClick={() => (window.location.href = "/login")} className="font-medium">
			Click to login
		</button>
	</div>
);
