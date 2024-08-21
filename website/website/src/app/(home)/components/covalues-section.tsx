import { Card, CardMetaHeading } from "@/components/card";
import { CustomMDX } from "@/components/mdx";
import { ParsedContent } from "@/lib/mdx-types";
import { PackagesSection } from "@/components/layout";

type Props = {
  contentItems: ParsedContent[];
};

export const CovaluesSection = ({ contentItems }: Props) => (
  <>
    <PackagesSection
      theme="covalues"
      heading="Collaborative Values"
      subheading="Your new building blocks."
      link="/docs"
      description={
        <>
          <p className="">
            Based on CRDTs and public-key cryptography, CoValues…
          </p>
          <ul className="list-disc list-inside pl-[2px]">
            <li>Can be read & edited like simple local JSON state</li>
            <li>
              Can be created anywhere, are automatically synced & persisted
            </li>
            <li>Always keep full edit history & author metadata</li>
            <li>Automatically resolve most conflicts</li>
          </ul>
        </>
      }
    >
      {contentItems.map((item, index) => (
        <Card key={index} theme="covalues">
          <CardMetaHeading theme="covalues">
            {item.metadata.title}
          </CardMetaHeading>
          <div className="prose prose-sm code-simple">
            <CustomMDX source={item.content} />
          </div>
        </Card>
      ))}
    </PackagesSection>
  </>
);
