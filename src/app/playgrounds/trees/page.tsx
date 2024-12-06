import { Box } from "./_components/Box";
import { OnClient } from "./_components/OnClient";
import { OnServer } from "./_components/OnServer";

export default function TreesPage() {
  return (
    <Box color="blue">
      <p>This is running on a server</p>
      <OnClient>
        <p>This is running on a client</p>
        <OnServer>
          <p>This is running on a server</p>
          <OnClient>
            <p>This is running on a client</p>
          </OnClient>
        </OnServer>
      </OnClient>
    </Box>
  );
}
