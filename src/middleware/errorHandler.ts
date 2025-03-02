import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export function errorHandler(err: Error, c: Context) {
	if (err instanceof HTTPException) {
		return c.json(
			{
				error: err.message || "An error occurred",
			},
			err.status,
		);
	}

	return c.json(
		{
			error: "Internal Server Error",
		},
		500,
	);
}
