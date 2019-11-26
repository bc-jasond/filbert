import { Map } from 'immutable';
import {
  NODE_TYPE_OL,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_IMAGE, NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_SPACER
} from '../../../common/constants';
import { insertCodeSection } from '../helpers-by-section-type/handle-code';
import { insertPhoto } from '../helpers-by-section-type/handle-image';
import { insertList } from '../helpers-by-section-type/handle-list';
import { insertQuote } from '../helpers-by-section-type/handle-quote';
import { insertSpacer } from '../helpers-by-section-type/handle-spacer';
import { insertH1, insertH2 } from '../helpers-by-section-type/handle-title';

/**
 * @return focusNodeId
 */
export async function insertSectionHelper(documentModel, sectionType, selectedNodeId, uploadFn) {
  // lists get added to content sections, keep current section
  switch (sectionType) {
    case NODE_TYPE_OL: {
      return insertList(documentModel, selectedNodeId);
    }
    case NODE_TYPE_SECTION_CODE: {
      return insertCodeSection(documentModel, selectedNodeId);
    }
    case NODE_TYPE_SECTION_SPACER: {
      return insertSpacer(documentModel, selectedNodeId);
    }
    case NODE_TYPE_SECTION_H1: {
      return insertH1(documentModel, selectedNodeId);
    }
    case NODE_TYPE_SECTION_H2: {
      return insertH2(documentModel, selectedNodeId);
    }
    case NODE_TYPE_SECTION_IMAGE: {
      const {
        imageId,
        width,
        height,
      } = await uploadFn();
      return insertPhoto(
        documentModel,
        selectedNodeId,
        Map({
          url: imageId,
          width,
          height,
        }),
      );
    }
    case NODE_TYPE_SECTION_QUOTE: {
      return insertQuote(documentModel, selectedNodeId);
    }
    default: {
      console.error('insertSectionHelper - unknown type! ', sectionType);
    }
  }
}