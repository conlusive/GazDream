// Static imports give Next the intrinsic size and a tiny blurred placeholder (blurDataURL), so each
// photo shows a soft preview instantly while the optimized file loads.
import installContainer from "../../public/photos/install-container.jpg";
import installHall from "../../public/photos/install-hall.jpg";
import installHopper from "../../public/photos/install-hopper.jpg";
import installWide from "../../public/photos/install-wide.jpg";

export const PHOTOS = {
  wide: installWide,
  container: installContainer,
  hopper: installHopper,
  hall: installHall,
} as const;
