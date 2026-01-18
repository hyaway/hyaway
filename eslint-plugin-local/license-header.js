// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

const EXPECTED_HEADER = `// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0
`;

const HEADER_LINES = EXPECTED_HEADER.split("\n");

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "layout",
    docs: {
      description: "Require SPDX license header at the top of files",
    },
    fixable: "code",
    schema: [],
    messages: {
      missingHeader: "Missing SPDX license header",
    },
  },
  create(context) {
    return {
      Program(node) {
        const sourceCode = context.sourceCode;
        const text = sourceCode.getText();
        const lines = text.split("\n");

        // Check if file starts with the expected header exactly
        const hasCorrectHeader =
          lines[0] === HEADER_LINES[0] && lines[1] === HEADER_LINES[1];

        if (hasCorrectHeader) return;

        // Find where existing SPDX headers end (to handle duplicates/malformed)
        let removeEndIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith("// SPDX") || line.startsWith("// Copyright")) {
            removeEndIndex += line.length + 1;
          } else if (
            line.trim() === "" &&
            i > 0 &&
            lines[i - 1].startsWith("// SPDX")
          ) {
            // Include blank line after header
            removeEndIndex += line.length + 1;
          } else {
            break;
          }
        }

        context.report({
          node,
          loc: { line: 1, column: 0 },
          messageId: "missingHeader",
          fix(fixer) {
            if (removeEndIndex > 0) {
              // Replace existing (possibly duplicate) headers
              return fixer.replaceTextRange(
                [0, removeEndIndex],
                EXPECTED_HEADER + "\n\n",
              );
            } else {
              // Insert at very beginning of file
              return fixer.insertTextBeforeRange(
                [0, 0],
                EXPECTED_HEADER + "\n\n",
              );
            }
          },
        });
      },
    };
  },
};
