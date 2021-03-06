import styled from 'styled-components'
import isequal from 'lodash.isequal'
import debounce from 'lodash.debounce'
import Router from 'next/router'
import MainForm from './MainForm'
import QuestionForm from './QuestionForm'
import Controls from './Controls'
import downloadExam from '../../lib/downloadExam'

const ExamMakerStyles = styled.div`
  height: calc(100vh - 6rem);
  background: ${props => props.theme.grey[1]};
`

const MainContent = styled.div`
  max-width: ${props => props.theme.maxWidth};
  height: calc(100vh - 6rem);
  margin: 0 auto;
  background: ${props => props.theme.white};
`

export default class ExamMaker extends React.Component {
  state = {
    mode: -1,
    id: '',
    published: false,
    verified: false,
    verificationPending: false,
    title: '',
    description: '',
    code: '',
    pass: '',
    time: '',
    image: '',
    downloads: '',
    cover: [],
    test: []
  }

  componentDidMount() {
    this.setExamState()
  }

  componentDidUpdate(prevProps) {
    if (!isequal(prevProps.exam, this.props.exam)) {
      this.setExamState()
    }
  }

  setExamState = () => this.setState({ ...this.props.exam })

  setModeState = mode => this.setState({ mode })

  onChange = ({ target: { name, value } }, updateExam) => {
    this.setState({ [name]: value })
    this.onUpdateExam(updateExam, name)
  }

  onUpdateExam = debounce(async (updateExam, name) => {
    const { id } = this.state
    const value = this.state[name]
    const data = { [name]: name === 'time' || name === 'pass' ? Number(value) : value }
    await updateExam({
      variables: { id, data }
    })
  }, 5000)

  onDownloadExam = async updateExam => {
    const {
      props: {
        exam: {
          id,
          user,
          title,
          description,
          code,
          time,
          pass,
          image,
          downloads,
          cover,
          test,
          createdAt
        }
      }
    } = this
    const payload = {
      id,
      author: {
        id: user.id,
        name: user.name,
        image: user.image
      },
      title,
      description,
      code,
      time: Number(time),
      pass: Number(pass),
      image,
      cover,
      test,
      createdAt
    }
    await updateExam({
      variables: { id, data: { downloads: downloads + 1 } }
    })
    downloadExam(payload)
  }

  onDeleteExam = async deleteExam => {
    const confirm = window.confirm('Are you sure you want to delete this exam?')
    if (confirm) {
      const { id } = this.state
      const res = await deleteExam({
        variables: { id }
      })
      if (res.data.deleteExam.success) {
        Router.push('/')
      }
    }
  }

  onDeleteQuestion = async deleteQuestion => {
    const confirm = window.confirm('Are you sure you want to delete this question?')
    if (confirm) {
      const res = await deleteQuestion()
      if (res.data.deleteQuestion.success) {
        this.setState({ mode: -1 })
      }
    }
  }

  render() {
    const {
      props: { user },
      state: {
        id,
        published,
        verified,
        verificationPending,
        mode,
        title,
        description,
        code,
        time,
        pass,
        image,
        cover,
        test
      }
    } = this
    return (
      <ExamMakerStyles>
        <MainContent>
          {mode === -1 ? (
            <MainForm
              user={user}
              id={id}
              published={published}
              verified={verified}
              verificationPending={verificationPending}
              title={title}
              description={description}
              code={code}
              time={time}
              pass={pass}
              image={image}
              cover={cover}
              onChange={this.onChange}
              onDownloadExam={this.onDownloadExam}
              onDeleteExam={this.onDeleteExam}
            />
          ) : (
            <React.Fragment>
              {test.map((el, i) => {
                if (i === mode) {
                  return (
                    <QuestionForm
                      key={el.id}
                      id={id}
                      question={el}
                      onDeleteQuestion={this.onDeleteQuestion}
                    />
                  )
                }
              })}
            </React.Fragment>
          )}
          <Controls mode={mode} id={id} length={test.length} setModeState={this.setModeState} />
        </MainContent>
      </ExamMakerStyles>
    )
  }
}
