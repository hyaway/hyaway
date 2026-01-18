// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

export function getFormDataWithSubmitter(e: React.FormEvent<HTMLFormElement>) {
  // IMPORTANT: new FormData(form) does NOT include the clicked submit button's name/value.
  // Modern browsers support passing the submitter (button) as the 2nd argument so its data is included.
  // Fallback for older browsers: append the submitter's name/value manually if the 2-arg ctor throws.
  const submitter = (e.nativeEvent as SubmitEvent).submitter as
    | HTMLButtonElement
    | HTMLInputElement
    | null;
  let formData: FormData;
  if (submitter) {
    try {
      // Feature-detect by attempting construction; spec-compliant browsers succeed.
      formData = new FormData(e.currentTarget, submitter);
    } catch {
      // Manual fallback: only append if submitter has a name attribute.
      formData = new FormData(e.currentTarget);
      if (submitter.getAttribute("name")) {
        formData.append(
          submitter.getAttribute("name")!,
          submitter.getAttribute("value") || "",
        );
      }
    }
  } else {
    formData = new FormData(e.currentTarget);
  }
  return formData;
}
