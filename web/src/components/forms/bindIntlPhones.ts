import intlTelInput, { type Iti } from "intl-tel-input";
import "intl-tel-input/styles";

const widgets = new WeakMap<HTMLInputElement, Iti>();

/** Flag + dial-code selector on public phone fields. Default country is Turkey. */
export function bindIntlPhones(root: ParentNode): void {
  root.querySelectorAll<HTMLInputElement>('input[type="tel"]').forEach((input) => {
    if (input.dataset.itiBound === "1" || input.closest(".iti")) return;
    input.dataset.itiBound = "1";
    const widget = intlTelInput(input, {
      initialCountry: "tr",
      separateDialCode: true,
      showFlags: true,
      loadUtils: () => import("intl-tel-input/utils"),
    });
    widgets.set(input, widget);
  });
}

/** Writes E.164 into the field before the form handler reads it. */
export function writePhoneNumbers(form: HTMLFormElement): void {
  form.querySelectorAll<HTMLInputElement>('input[type="tel"]').forEach((input) => {
    const number = widgets.get(input)?.getNumber();
    if (number) input.value = number;
  });
}
