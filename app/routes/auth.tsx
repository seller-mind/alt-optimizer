import type { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Simply render the form - no SDK calls needed here
  return null;
};

export default function Auth() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Install AltOptimizer</title>
        <style>{`
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 60px auto; padding: 0 20px; color: #202223; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          p { color: #6d7175; margin-bottom: 24px; }
          label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px; }
          input { width: 100%; padding: 10px 12px; border: 1px solid #c9cccf; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
          input:focus { outline: none; border-color: #2c6ecb; box-shadow: 0 0 0 1px #2c6ecb; }
          button { margin-top: 16px; width: 100%; padding: 10px 20px; background: #2c6ecb; color: #fff; border: none; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer; }
          button:hover { background: #1a56b5; }
          .error { color: #d82c0d; font-size: 13px; margin-top: 8px; }
          .help { font-size: 12px; color: #6d7175; margin-top: 4px; }
        `}</style>
      </head>
      <body>
        <h1>Install AltOptimizer</h1>
        <p>Enter your Shopify store domain to authorize the app.</p>
        <form method="post" action="/auth/login">
          <label htmlFor="shop">Shop domain</label>
          <input
            type="text"
            id="shop"
            name="shop"
            placeholder="my-shop.myshopify.com"
            autoComplete="on"
          />
          <div className="help">e.g: haimo-dev.myshopify.com</div>
          <button type="submit">Install App</button>
        </form>
      </body>
    </html>
  );
}
