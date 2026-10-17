import { Avatar } from "@dicebear/core";
import { create as initials } from "@dicebear/initials";

export function avatarDataUri(seed: string) {
  return new Avatar(
    initials as never,
    {
      seed: seed || "reader",
      backgroundColor: ["f15a3a", "109fe9", "f4c95d"],
      radius: 50,
      size: 256,
    } as never,
  ).toDataUri();
}
