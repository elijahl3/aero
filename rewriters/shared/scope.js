// Module only
import * as config from "../../config.js";

if (typeof $aero === "undefined")
	var $aero = {
		config: config,
	};

/**
 * Deep property check scoping
 * @param {string} The script to be rewritten
 * @return {string} The rewritten script
 */
$aero.scope = script => {
	if ($aero.config.flags.advancedScoping) {
		const hide = src => src;

		const sur = v =>
			new RegExp(
				`(,|,\\s+)(?<!\\.|_|[a-zA-Z])?(${v})(?!:|=|_|[a-zA-Z])(,|\\s+,)?`
			);
		const surName = (name, m, g1, g2, g3) => {
			// Don't replace if it is within a function's parameters. Detected by commands surrounding the variable name.
			return typeof g1 !== "undefined" && typeof g2 !== "undefined"
				? `${g1}${name}${g3}`
				: m;
		};

		let rewrittenScript = hide(script)
			.replace(sur("document\\.domain"), (m, g1, g2, g3) =>
				surName("$aero.document.domain", m, g1, g2, g3)
			)
			.replace(sur("document\\.url"), (m, g1, g2, g3) =>
				surName("$aero.document.URL", m, g1, g2, g3)
			)
			.replace(
				sur("location"),
				// Ensure that the location in the current scope wasn't overwritten
				(m, g1, g2, g3) =>
					surName(
						`($aero.isLocation(location) ? $aero.location : location)`,
						m,
						g1,
						g2,
						g3
					)
			)
			.replace(sur("eval"), (m, g1, g2, g3) =>
				surName("$aero.eval", m, g1, g2, g3)
			)
			.replace(
				/(["\']).*?(?<!\\)(\\\\)*\1|((return|return\s+|,|,\s+|for|var|let|const|\))?((?:(\([^)(]*\)|\?\.|[a-zA-Z\.$_])*)?\[[^\][]*]))(,|\s+,)?/g,
				(m, g1, g2, g3, g4, g5, g6, g7, offset, string) => {
					/*
						Return original match
							g5 - Whatever proceeds the match. Could be for ignore patterns or checking to see if the \
							g7 - comma ignore

						Rewrite
								g3 - The match we want
							*/

					// General scoping cases
					const canScope =
						// Ensure that there is no return or variable statements
						typeof g4 === "undefined" &&
						// Ensure that there are no commas, since that indicates a destructure
						typeof g7 === "undefined" &&
						// Ensure that the brackets have been matched
						typeof g3 !== "undefined" &&
						g3.endsWith("]");
					if (canScope) {
						console.log(g3);

						const rewrite = `$aero.check(${m})`;

						if ($aero.config.debug.scoping)
							console.log(`Check ${m} -> ${rewrite}`);

						return rewrite;
					} else return m;
				}
			);
	} else {
		return script
			.replace(/location/g, "$aero.location")
			.replace(/window\.location/g, "window.$aero.location")
			.replace(/document\.domain/g, "$aero.document.domain")
			.replace(/document\.URL/g, "$aero.document.URL")
			.replace(/eval/g, "$aero.eval");
	}

	if ($aero.config.debug.scoping)
		console.log(`Scoping script\n${script}\n->\n${rewrittenScript}`);

	return rewrittenScript;
};

export default $aero.scope;
