import * as z from "zod";

/**
 * App-wide Zod error map (Lao). Field-level `.min(..., { message })` still wins.
 */
function laoErrorMap(issue: z.core.$ZodRawIssue): string | undefined {
  switch (issue.code) {
    case "invalid_type": {
      if (issue.expected === "number") return "ກະລຸນາໃສ່ຕົວເລກ";
      return "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ";
    }
    case "invalid_value":
      return "ຄ່າບໍ່ຖືກຕ້ອງ";
    case "too_big": {
      if (issue.origin === "string") {
        return `ຕ້ອງບໍ່ເກີນ ${issue.maximum} ຕົວອັກສອນ`;
      }
      if (issue.origin === "number") {
        const adj = issue.inclusive ? "≤" : "<";
        return `ຕ້ອງ ${adj} ${issue.maximum}`;
      }
      return "ຄ່າໃຫຍ່ເກີນໄປ";
    }
    case "too_small": {
      if (issue.origin === "string") {
        if (issue.minimum === 1) return "ກະລຸນາກອກຂໍ້ມູນ";
        return `ຕ້ອງມີຢ່າງໜ້ອຍ ${issue.minimum} ຕົວອັກສອນ`;
      }
      if (issue.origin === "number") {
        const adj = issue.inclusive ? "≥" : ">";
        return `ຕ້ອງ ${adj} ${issue.minimum}`;
      }
      return "ຄ່ານ້ອຍເກີນໄປ";
    }
    case "invalid_format": {
      const format = "format" in issue ? issue.format : undefined;
      if (format === "email") return "ອີເມວບໍ່ຖືກຕ້ອງ";
      return "ຮູບແບບບໍ່ຖືກຕ້ອງ";
    }
    case "not_multiple_of":
      return `ຕ້ອງເປັນພຫຸ່ນຂອງ ${issue.divisor}`;
    case "invalid_union":
      return "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ";
    default:
      return "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ";
  }
}

let configured = false;

export function configureZodLao() {
  if (configured) return;
  configured = true;
  z.config({
    localeError: laoErrorMap,
  });
}

/** Non-negative integer (prices, stock). */
export function zNonNegativeInt(label: string) {
  return z.coerce
    .number({ message: `ກະລຸນາໃສ່${label}` })
    .int({ message: `${label}ຕ້ອງເປັນຈຳນວນເຕັມ` })
    .min(0, { message: `${label}ຕ້ອງ ≥ 0` });
}

/** Positive integer (adjust qty). */
export function zPositiveInt(label: string) {
  return z.coerce
    .number({ message: `ກະລຸນາໃສ່${label}` })
    .int({ message: `${label}ຕ້ອງເປັນຈຳນວນເຕັມ` })
    .positive({ message: `${label}ຕ້ອງ > 0` });
}
