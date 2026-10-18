import { createAvatar } from "@dicebear/core";
import * as initials from "@dicebear/initials";

export function avatarDataUri(seed: string) {
  return createAvatar(initials, {
    seed: seed || "reader",
    backgroundColor: ["f15a3a", "109fe9", "f4c95d"],
    radius: 50,
    size: 256,
  }).toDataUri();
}
