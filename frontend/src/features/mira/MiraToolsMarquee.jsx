import { InfiniteMovingCards } from '../../components/ui/infinite-moving-cards'
import opencvLogo from '../../assets/mira/opencv.png'
import pythonLogo from '../../assets/mira/python.png'
import awsLogo from '../../assets/mira/aws.png'
import tensorflowLogo from '../../assets/mira/tensorflow.png'
import cppLogo from '../../assets/mira/cpp.png'
import reactLogo from '../../assets/mira/react.png'

const TOOLS = [
  { name: 'Python', image: pythonLogo },
  { name: 'React', image: reactLogo },
  { name: 'C++', image: cppLogo },
  { name: 'TensorFlow', image: tensorflowLogo },
  { name: 'OpenCV', image: opencvLogo },
  { name: 'AWS', image: awsLogo },
]

export default function MiraToolsMarquee() {
  return (
    <div className="mb-10">
      <p className="section-label text-center mb-4">Practice interviews built around real-world tools</p>
      <InfiniteMovingCards items={TOOLS} direction="left" speed="slow" />
    </div>
  )
}
